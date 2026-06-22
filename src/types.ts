/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IPlaylistItem {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
}

export interface IScreenSlot {
  id: number; // 0, 1, 2, or 3 for 4 screens
  item: IPlaylistItem | null;
  isMuted: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  lowLatencyEnabled: boolean;
}

export interface IPlaybackHistory {
  itemId: string;
  timestamp: number;
}

export const isStaticSite = typeof window !== "undefined" && 
  !window.location.hostname.includes("localhost") && 
  !window.location.hostname.includes("127.0.0.1") && 
  !window.location.hostname.includes("run.app");

export const getApiUrl = (path: string): string => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.includes("run.app")) {
      return path;
    }
  }
  // Otherwise, route requests to our deployed Cloud Run server proxy (for sandbox environment)
  return `https://ais-pre-qlj7czuvstz45iuihdgpce-983444617668.europe-west2.run.app${path}`;
};
