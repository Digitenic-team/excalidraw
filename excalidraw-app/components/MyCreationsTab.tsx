import React from "react";

import clsx from "clsx";

import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";

import {
  FreedrawIcon,
  LoadIcon,
  TrashIcon,
  share,
  copyIcon,
} from "@excalidraw/excalidraw/components/icons";

import { timeAgo } from "../utils/time";

import { useAtom, useSetAtom } from "../app-jotai";
import {
  userAtom,
  createCanvasDialogAtom,
  renameCanvasDialogAtom,
} from "../app-jotai";

import "./MyCreationsTab.scss";

import type { CanvasMetadata } from "../data/storage";

interface MyCreationsTabProps {
  canvases: readonly CanvasMetadata[];
  onCanvasSelect: (id: string) => void;
  onCanvasDelete: (id: string) => void;
  onCanvasShare: (id: string) => Promise<string | null>;
  onCanvasUnshare: (id: string) => Promise<void>;
  canShare: boolean;
  currentCanvasId: string | null;
}

export const MyCreationsTab: React.FC<MyCreationsTabProps> = ({
  canvases,
  onCanvasSelect,
  onCanvasDelete,
  onCanvasShare,
  onCanvasUnshare,
  canShare,
  currentCanvasId,
}) => {
  const [user] = useAtom(userAtom);
  const setCreateCanvasDialog = useSetAtom(createCanvasDialogAtom);
  const setRenameCanvasDialog = useSetAtom(renameCanvasDialogAtom);

  // The share link to surface inline after a successful publish, plus a
  // transient "copied" acknowledgement keyed by canvas id.
  const [sharedLink, setSharedLink] = React.useState<{
    id: string;
    url: string;
  } | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const copyToClipboard = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); the link is
      // still shown inline for manual copying.
    }
  };

  const handleShareToggle = async (canvas: CanvasMetadata) => {
    setPendingId(canvas.id);
    try {
      if (canvas.public) {
        await onCanvasUnshare(canvas.id);
        if (sharedLink?.id === canvas.id) {
          setSharedLink(null);
        }
      } else {
        const url = await onCanvasShare(canvas.id);
        if (url) {
          setSharedLink({ id: canvas.id, url });
          await copyToClipboard(canvas.id, url);
        }
      }
    } finally {
      setPendingId(null);
    }
  };

  const sortedCanvases = [...canvases].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="my-creations-tab">
      <div style={{ marginBottom: "1rem" }}>
        <FilledButton
          label="Create New Canvas"
          onClick={() => setCreateCanvasDialog({ isOpen: true })}
          fullWidth
        >
          Create New Canvas
        </FilledButton>
      </div>
      <div className="my-creations-tab__grid">
        {canvases.length === 0 ? (
          <div className="my-creations-tab__empty">
            {LoadIcon}
            <p>You have no saved canvases yet.</p>
            <p>
              Create a new canvas to get started. It will be saved{" "}
              {user ? "to your account" : "in your browser"}.
            </p>
          </div>
        ) : (
          sortedCanvases.map((canvas) => (
            <div
              key={canvas.id}
              className={clsx("my-creations-tab__card", {
                "my-creations-tab__card--active": canvas.id === currentCanvasId,
              })}
              onClick={() => onCanvasSelect(canvas.id)}
            >
              {canvas.thumbnail ? (
                <img
                  src={canvas.thumbnail}
                  alt={canvas.name}
                  className="my-creations-tab__card-thumbnail"
                />
              ) : (
                <div className="my-creations-tab__card-thumbnail--placeholder">
                  No preview
                </div>
              )}
              <div className="my-creations-tab__card-info">
                <div className="my-creations-tab__card-details">
                  <span className="my-creations-tab__card-name">
                    {canvas.name}
                    {canvas.public && (
                      <span
                        className="my-creations-tab__card-badge"
                        title="Shared publicly (view-only)"
                      >
                        Shared
                      </span>
                    )}
                  </span>
                  <span className="my-creations-tab__card-date">
                    {timeAgo(canvas.updatedAt)}
                  </span>
                </div>
                <div className="my-creations-tab__card-actions">
                  {canShare && (
                    <button
                      className={clsx("my-creations-tab__card-share", {
                        "my-creations-tab__card-share--active": canvas.public,
                      })}
                      title={
                        canvas.public ? "Stop sharing" : "Share view-only link"
                      }
                      disabled={pendingId === canvas.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareToggle(canvas);
                      }}
                    >
                      {share}
                    </button>
                  )}
                  <button
                    className="my-creations-tab__card-rename"
                    title="Rename canvas"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameCanvasDialog({
                        isOpen: true,
                        canvasId: canvas.id,
                        currentName: canvas.name,
                      });
                    }}
                  >
                    {FreedrawIcon}
                  </button>
                  <button
                    className="my-creations-tab__card-delete"
                    title="Delete canvas"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCanvasDelete(canvas.id);
                    }}
                  >
                    {TrashIcon}
                  </button>
                </div>
              </div>
              {sharedLink?.id === canvas.id && (
                <div
                  className="my-creations-tab__card-share-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    readOnly
                    value={sharedLink.url}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    title="Copy link"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(canvas.id, sharedLink.url);
                    }}
                  >
                    {copiedId === canvas.id ? "Copied!" : copyIcon}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
