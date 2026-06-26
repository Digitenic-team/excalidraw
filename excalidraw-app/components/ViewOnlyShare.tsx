import { Excalidraw } from "@excalidraw/excalidraw";
import { restoreAppState } from "@excalidraw/excalidraw/data/restore";
import { t } from "@excalidraw/excalidraw/i18n";
import { useEffect, useState } from "react";

import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

import { loadPublicCanvas } from "../data/storageAdapters/BackendStorageAdapter";

/**
 * Reads a public share token from a `#view=<token>` URL hash.
 * Returns null if the hash is not a view-only share link.
 */
export const getViewOnlyShareId = (): string | null => {
  const match = window.location.hash.match(/^#view=([a-zA-Z0-9_-]+)$/);
  return match ? match[1] : null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ExcalidrawInitialDataState };

/**
 * Renders a publicly shared canvas read-only. It performs an unauthenticated
 * fetch of the share snapshot and forces `viewModeEnabled`, deliberately
 * skipping all collaboration, autosave, storage and account chrome that the
 * full editor wires up.
 */
export const ViewOnlyShare = ({ shareId }: { shareId: string }) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadPublicCanvas(shareId)
      .then((canvasData) => {
        if (cancelled) {
          return;
        }
        if (!canvasData) {
          setState({
            status: "error",
            message: t("alerts.invalidSceneUrl"),
          });
          return;
        }
        setState({
          status: "ready",
          data: {
            elements: canvasData.elements,
            appState: restoreAppState(canvasData.appState, null),
            files: canvasData.files,
            scrollToContent: true,
          },
        });
      })
      .catch((error: any) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error?.message || t("alerts.invalidSceneUrl"),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (state.status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <p>{t("labels.loadingScene")}</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%" }} className="excalidraw-app">
      <Excalidraw
        initialData={state.data}
        viewModeEnabled={true}
        detectScroll={false}
      />
    </div>
  );
};
