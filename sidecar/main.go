package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/seanly/dmr/pkg/agent"
	"github.com/seanly/dmr/pkg/config"
	"github.com/seanly/dmr/pkg/plugin"
	"github.com/seanly/dmr/pkg/tape"
)

type Server struct {
	cfg          *config.Config
	agent        *agent.Agent
	tapeManager  *tape.TapeManager
	pluginMgr    *plugin.Manager
	mux          *http.ServeMux
	sseClients   map[chan ServerEvent]struct{}
	sseClientsMu sync.Mutex
}

type ServerEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []ChatMessage `json:"messages"`
	Tape     string        `json:"tape"`
}

func NewServer(cfg *config.Config) (*Server, error) {
	s := &Server{
		cfg:        cfg,
		mux:        http.NewServeMux(),
		sseClients: make(map[chan ServerEvent]struct{}),
	}

	// TODO: 初始化 agent, tapeManager, pluginMgr
	// 这里需要参考 dmr/cmd/dmr/commands.go 的 runServeLogic

	s.setupRoutes()
	return s, nil
}

func (s *Server) setupRoutes() {
	s.mux.HandleFunc("/api/health", s.handleHealth)
	s.mux.HandleFunc("/api/chat", s.handleChat)
	s.mux.HandleFunc("/api/history", s.handleHistory)
	s.mux.HandleFunc("/api/events", s.handleSSE)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *Server) handleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// TODO: 实现 chat 逻辑
	// 1. 加载 tape
	// 2. 调用 agent
	// 3. 流式返回结果

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// 示例响应
	fmt.Fprintf(w, "data: %s\n\n", `{"type":"message","content":"Hello from DMR Desktop"}`)
	flusher.Flush()
}

func (s *Server) handleHistory(w http.ResponseWriter, r *http.Request) {
	// TODO: 返回历史消息
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode([]ChatMessage{})
}

func (s *Server) handleSSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	eventChan := make(chan ServerEvent, 10)
	s.sseClientsMu.Lock()
	s.sseClients[eventChan] = struct{}{}
	s.sseClientsMu.Unlock()

	defer func() {
		s.sseClientsMu.Lock()
		delete(s.sseClients, eventChan)
		s.sseClientsMu.Unlock()
		close(eventChan)
	}()

	for {
		select {
		case event := <-eventChan:
			data, _ := json.Marshal(event)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func main() {
	var (
		listen = flag.String("listen", ":8080", "HTTP server listen address")
		tape   = flag.String("tape", "desktop", "Default tape name")
	)
	flag.Parse()

	log.Printf("DMR Desktop Sidecar starting...")
	log.Printf("Listen: %s", *listen)
	log.Printf("Tape: %s", *tape)

	// 加载配置
	cfg, err := config.Load("")
	if err != nil {
		log.Printf("Warning: failed to load config: %v, using defaults", err)
		cfg = &config.Config{}
	}

	// 创建服务器
	srv, err := NewServer(cfg)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	httpServer := &http.Server{
		Addr:    *listen,
		Handler: srv.mux,
	}

	// 优雅关闭
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := httpServer.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("Server listening on %s", *listen)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		// 如果端口被占用，尝试查找并杀死占用进程
		if strings.Contains(err.Error(), "address already in use") {
			log.Printf("Port already in use, attempting to find available port...")
			// 尝试使用随机端口
			listener, err := net.Listen("tcp", ":0")
			if err != nil {
				fmt.Fprintf(os.Stderr, "Failed to find available port: %v\n", err)
				os.Exit(1)
			}
			actualAddr := listener.Addr().String()
			listener.Close()

			httpServer.Addr = actualAddr
			log.Printf("Using alternative address: %s", actualAddr)

			if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
				os.Exit(1)
			}
		} else {
			fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
			os.Exit(1)
		}
	}
}
