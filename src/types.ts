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
