import { ApprovalOverlay } from "./components/ApprovalOverlay";
import { LoginPage } from "./components/LoginPage";
import { ChatHeader, ChatMessageList, ChatComposer } from "./components/chat";
import { ContextUsageBar } from "./components/chat/ContextUsageBar";
import { CreateTapeDialog } from "./components/CreateTapeDialog";
import { CreateHandoffDialog } from "./components/CreateHandoffDialog";
import { TapeSelectDialog } from "./components/TapeSelectDialog";
import { AnchorSelectDialog } from "./components/AnchorSelectDialog";
import { ErrorDialog } from "./components/ErrorDialog";
import { useTapeChatSession } from "./hooks/useTapeChatSession";

export default function App() {
  const {
    user,
    setUser,
    authChecked,
    authEnabled,
    messages,
    input,
    setInput,
    loading,
    tapeName,
    tapeOptions,
    historyAfterEntryId,
    anchors,
    loadedHistoryCount,
    browsePrefixLength,
    contextUsage,
    scrollRef,
    inputRef,
    loadTapes,
    loadAnchors,
    anchorWindowLabel,
    handleTapeChange,
    handleAnchorChange,
    sendMessage,
    handleKeyDown,
    isEmpty,
    hasSession,
    showLanding,
    showCreateTapeDialog,
    setShowCreateTapeDialog,
    showCreateHandoffDialog,
    setShowCreateHandoffDialog,
    showTapeSelectDialog,
    setShowTapeSelectDialog,
    showAnchorSelectDialog,
    setShowAnchorSelectDialog,
    errorDialog,
    setErrorDialog,
    createTape,
    createHandoffAnchor,
    suggestedHandoffName,
  } = useTapeChatSession();

  if (!authChecked) return null;
  if (authEnabled && !user) {
    return <LoginPage onLogin={(username) => setUser(username)} />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader
        tapeName={tapeName}
        onTapeClick={() => setShowTapeSelectDialog(true)}
        historyAfterEntryId={historyAfterEntryId}
        onAnchorClick={() => setShowAnchorSelectDialog(true)}
        anchors={anchors}
        isEmpty={isEmpty}
        browsePrefixLength={browsePrefixLength}
        loadedHistoryCount={loadedHistoryCount}
        hasSession={hasSession}
        showLanding={showLanding}
        messages={messages}
        scrollRef={scrollRef}
        inputRef={inputRef}
        authEnabled={authEnabled}
        user={user}
        onLogout={() => setUser(null)}
      />

      <ContextUsageBar contextUsage={contextUsage} />

      <div className="flex min-h-0 flex-1 flex-col">
        <ChatMessageList
          scrollRef={scrollRef}
          isEmpty={isEmpty}
          loading={loading}
          messages={messages}
          tapeName={tapeName}
          historyAfterEntryId={historyAfterEntryId}
          loadedHistoryCount={loadedHistoryCount}
          browsePrefixLength={browsePrefixLength}
          anchorWindowLabel={anchorWindowLabel}
        />

        <ChatComposer
          input={input}
          onInputChange={setInput}
          onKeyDown={handleKeyDown}
          loading={loading}
          onSend={() => void sendMessage()}
          inputRef={inputRef}
        />
      </div>

      <ApprovalOverlay />

      <TapeSelectDialog
        open={showTapeSelectDialog}
        onClose={() => setShowTapeSelectDialog(false)}
        currentTape={tapeName}
        tapes={tapeOptions}
        onSelect={handleTapeChange}
        onRefresh={loadTapes}
        onCreateNew={() => setShowCreateTapeDialog(true)}
      />

      <AnchorSelectDialog
        open={showAnchorSelectDialog}
        onClose={() => setShowAnchorSelectDialog(false)}
        currentAnchorId={historyAfterEntryId}
        anchors={anchors}
        onSelect={handleAnchorChange}
        onRefresh={loadAnchors}
        onCreateNew={() => setShowCreateHandoffDialog(true)}
      />

      <CreateTapeDialog
        open={showCreateTapeDialog}
        onClose={() => setShowCreateTapeDialog(false)}
        onSubmit={createTape}
      />

      <CreateHandoffDialog
        open={showCreateHandoffDialog}
        onClose={() => setShowCreateHandoffDialog(false)}
        onSubmit={createHandoffAnchor}
        suggestedName={suggestedHandoffName}
      />

      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, message: "" })}
        message={errorDialog.message}
      />
    </div>
  );
}
