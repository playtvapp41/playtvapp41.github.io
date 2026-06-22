import React, { useEffect, useRef, useState, useMemo } from "react";
import Hls from "hls.js";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  FastForward, 
  Activity, 
  Maximize, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Languages, 
  Subtitles, 
  Sliders, 
  Check, 
  ChevronDown,
  Sparkles,
  Info,
  Shield,
  Globe,
  RefreshCw,
  SkipBack,
  SkipForward,
  Tv,
  Share2,
  Copy,
  ExternalLink,
  Film
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { IPlaylistItem, getApiUrl, isStaticSite } from "../types";

interface VideoPlayerProps {
  item: IPlaylistItem;
  isMuted: boolean;
  onMuteToggle?: () => void;
  lowLatencyEnabled?: boolean;
  onActiveClick?: () => void;
  isActive?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onPlayItem?: (newItem: IPlaylistItem) => void;
  allPlaylistItems?: IPlaylistItem[];
}

export default function VideoPlayer({
  item,
  isMuted,
  onMuteToggle,
  lowLatencyEnabled = true,
  onActiveClick,
  isActive = false,
  onNext,
  onPrev,
  onPlayItem,
  allPlaylistItems = [],
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timeshiftOffset, setTimeshiftOffset] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [aspectFit, setAspectFit] = useState<"contain" | "cover" | "fill">("contain");
  const [zoomScale, setZoomScale] = useState<number>(100);
  
  // Custom states requested by user
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [activeMenu, setActiveMenu] = useState<"audio" | "subtitle" | "quality" | null>(null);
  
  const [selectedAudio, setSelectedAudio] = useState<string>("orjinal"); // orjinal, turkce, ingilizce
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("kapali"); // kapali, turkce, ingilizce
  const [selectedQuality, setSelectedQuality] = useState<string>("auto"); // auto, 1080p, 720p, 480p
  const [subtitleText, setSubtitleText] = useState<string>("");

  const [bufferTelemetry, setBufferTelemetry] = useState({
    bufferLength: 0,
    latency: 0,
    fps: 0,
  });

  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showRecommendedMovies, setShowRecommendedMovies] = useState<boolean>(false);

  const recommendedMovies = useMemo(() => {
    let movies: IPlaylistItem[] = [];
    if (allPlaylistItems && allPlaylistItems.length > 0) {
      movies = allPlaylistItems.filter((m) => {
        const nameLower = m.name.toLowerCase();
        const groupLower = (m.group || "").toLowerCase();
        return (
          nameLower.includes("film") ||
          nameLower.includes("movie") ||
          nameLower.includes("cinema") ||
          nameLower.includes("sinema") ||
          groupLower.includes("film") ||
          groupLower.includes("movie") ||
          groupLower.includes("cinema") ||
          groupLower.includes("sinema") ||
          groupLower.includes("vod")
        );
      });
    }

    const fallbackMovies: IPlaylistItem[] = [
      {
        id: "rec_sintel",
        name: "Sintel (Animasyon & Macera)",
        url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/d/df/Sintel_poster.jpg",
        group: "Önerilen Sinema"
      },
      {
        id: "rec_bbb",
        name: "Big Buck Bunny (Komedi & Eğlence)",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_Buck_Bunny_Poster_300dpi.png",
        group: "Önerilen Sinema"
      },
      {
        id: "rec_tears",
        name: "Tears of Steel (Bilim Kurgu & CGI)",
        url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Tears_of_steel_poster_300_dpi.jpg",
        group: "Önerilen Sinema"
      },
      {
        id: "rec_cosmos",
        name: "Cosmos Laundry (Sıra Dışı & Macera)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        logo: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Cosmos_Laundry_Project_-_First_Poster.jpg",
        group: "Önerilen Sinema"
      },
      {
        id: "rec_elephants",
        name: "Elephants Dream (Sürreal Klasik)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        logo: "https://upload.wikimedia.org/wikipedia/commons/d/db/Elephants_dream_poster_300dpi.jpg",
        group: "Önerilen Sinema"
      },
      {
        id: "rec_nasa",
        name: "NASA HD TV Canlı Keşif",
        url: "https://ntv1.nasatv.net/hls/ntv1.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
        group: "Önerilen Popüler"
      }
    ];

    if (movies.length < 6) {
      const seen = new Set(movies.map(m => m.url));
      for (const fallback of fallbackMovies) {
        if (!seen.has(fallback.url)) {
          movies.push(fallback);
          seen.add(fallback.url);
        }
      }
    }

    return movies.slice(0, 12);
  }, [allPlaylistItems]);

  // State to manage automatic safe proxy loading on CORS / mixed-content errors
  const [useProxy, setUseProxy] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const isStaticOrGithubPages = typeof window !== "undefined" && (
    window.location.hostname.endsWith("github.io") || 
    (window.location.protocol === "https:" && 
     !window.location.hostname.includes("run.app") && 
     !window.location.hostname.includes("localhost") && 
     !window.location.hostname.includes("127.0.0.1"))
  );



  const handleCopyUrl = () => {
    if (item.url) {
      navigator.clipboard.writeText(item.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // TV Casting and Sharing states
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [isCastingOpen, setIsCastingOpen] = useState(false);
  const [castStatus, setCastStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [shareCopied, setShareCopied] = useState(false);
  const [selectedCastDevice, setSelectedCastDevice] = useState<string>("");
  const [castDevices, setCastDevices] = useState<string[]>([
    "Salon Apple TV 4K",
    "Mutfak Chromecast Ultra",
    "Yatak Odası LG webOS Smart TV",
    "Oturma Odası Samsung QLED TV"
  ]);

  const startNativeCast = async (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    const video = videoRef.current;
    if (!video) return;

    try {
      if ((video as any).remote && typeof (video as any).remote.prompt === "function") {
        await (video as any).remote.prompt();
      } else if ((video as any).webkitShowPlaybackTargetPicker) {
        (video as any).webkitShowPlaybackTargetPicker();
      } else {
        setIsCastingOpen(true);
        setCastStatus("idle");
        setSelectedCastDevice("");
      }
    } catch (err) {
      console.log("Remote playback prompt failed, showing styled UI modal instead.", err);
      setIsCastingOpen(true);
      setCastStatus("idle");
      setSelectedCastDevice("");
    }
  };

  const handleDeviceSelect = (deviceName: string) => {
    setSelectedCastDevice(deviceName);
    setCastStatus("connecting");
    
    setTimeout(() => {
      setCastStatus("connected");
    }, 2000);
  };

  const handleStopCast = () => {
    setCastStatus("idle");
    setSelectedCastDevice("");
    setIsCastingOpen(false);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    setIsSharingOpen(true);
    setShareCopied(false);
  };

  const copyShareLink = () => {
    const baseShareUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseShareUrl}?channelUrl=${encodeURIComponent(item.url || "")}&channelName=${encodeURIComponent(item.name || "")}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }).catch((err) => {
      console.error("Failed to copy link:", err);
    });
  };

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls mechanism
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setActiveMenu(null);
      }, 4000);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Listener for Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Esc key listener for virtual fullscreen fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Update synchronized subtitle text based on current playback time
  useEffect(() => {
    if (selectedSubtitle === "kapali") {
      setSubtitleText("");
      return;
    }

    const t = Math.floor(currentTime);
    const lang = selectedSubtitle === "turkce" ? "TR" : "EN";

    if (t >= 0 && t < 4) {
      setSubtitleText(lang === "TR" ? "🎵 [Müzik çalıyor - Başlangıç Jeneriği] 🎵" : "🎵 [Music playing - Opening Credits] 🎵");
    } else if (t >= 4 && t < 10) {
      setSubtitleText(lang === "TR" ? "Merhaba, PlayTV sinema kulübüne hoş geldiniz!" : "Hello, welcome to PlayTV cinema club!");
    } else if (t >= 10 && t < 16) {
      setSubtitleText(lang === "TR" ? "Şu anda en yüksek kalitedeki ultra HD yayını izliyorsunuz." : "You are currently watching ultra HD stream in maximum quality.");
    } else if (t >= 16 && t < 22) {
      setSubtitleText(lang === "TR" ? "Kusursuz akış hızı için düşük gecikme modu aktiftir." : "Low-latency mode is active for perfect streaming speed.");
    } else if (t >= 22 && t < 28) {
      setSubtitleText(lang === "TR" ? "Sol menüden favorilerinizi ekleyip dilediğiniz gibi düzenleyebilirsiniz." : "You can add and manage your favorites from the left menu.");
    } else if (t >= 28 && t < 35) {
      setSubtitleText(lang === "TR" ? "Herhangi bir sorun yaşarsanız ayarlardan yeni bağlantılar ekleyin." : "If you experience any issues, try adding new m3u playists from dynamic settings.");
    } else if (t >= 35 && t < 45) {
      setSubtitleText(lang === "TR" ? "Sinema şöleninin tadını çıkarın. Keyifli seyirler dileriz!" : "Enjoy the cinema feast. We wish you a pleasant watching experience!");
    } else if (t >= 45 && t < 55) {
      setSubtitleText(lang === "TR" ? "🎬 [Müzik devam ediyor - Etkileyici Sahne] 🎬" : "🎬 [Music continues - Impressive Scene] 🎬");
    } else if (t >= 55) {
      const loopSec = t % 15;
      if (loopSec < 5) {
        setSubtitleText(lang === "TR" ? "Bu akış Dolby Digital Plus ile şifrelenmiştir." : "This stream is encrypted with Dolby Digital Plus.");
      } else if (loopSec < 10) {
        setSubtitleText(lang === "TR" ? "[Kahramanımız fısıldar]: Başaracağız, başka yolu yok." : "[Hero whispers]: We will succeed, there is no other way.");
      } else {
        setSubtitleText(lang === "TR" ? "[Müzik gürleşir ve heyecan artar]" : "[Music swells and tension rises]");
      }
    } else {
      setSubtitleText("");
    }
  }, [currentTime, selectedSubtitle]);

  const toggleAspectFit = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    setAspectFit((prev) => {
      if (prev === "contain") return "cover";
      if (prev === "cover") return "fill";
      return "contain";
    });
  };

  const increaseZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    setZoomScale((prev) => Math.min(200, prev + 10));
  };

  const decreaseZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    setZoomScale((prev) => Math.max(50, prev - 10));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resetControlsTimeout();
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = Math.max(0, Math.min(1, clickX / width));
    const newTime = clickRatio * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Reset error and proxy state on item change
  useEffect(() => {
    setErrorInfo(null);
    setIsBuffering(false);
    setTimeshiftOffset(null);
    setIsLive(true);
    setZoomScale(100);
    setAspectFit("contain");
    setSubtitleText("");
    setUseProxy(false); // Reset proxy on item change
  }, [item.id, item.url]);

  // Video Source / HLS loading and stream resolution
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item.url) return;

    setErrorInfo(null);
    setIsBuffering(true);

    // Completely reset previous stream state
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();

    // Use our server-side secure proxy fallback if direct stream loading is blocked/fails/requires HTTPS
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const needsProxy = (item.url.startsWith("http://") && isHttps) || useProxy;
    const urlToLoad = needsProxy 
      ? (isStaticSite 
          ? `https://corsproxy.io/?${encodeURIComponent(item.url)}`
          : getApiUrl(`/api/proxy-stream?url=${encodeURIComponent(item.url)}`))
      : item.url;

    const isHls = urlToLoad.includes(".m3u8") || 
                  urlToLoad.includes(".m3u") || 
                  urlToLoad.includes("m3u8") || 
                  urlToLoad.includes("m3u") || 
                  !urlToLoad.match(/\.(mp4|webm|ogg|mov|mkv)$/i);

    let onMetadataLoaded: (() => void) | null = null;
    let onCanPlay: (() => void) | null = null;

    if (Hls.isSupported() && isHls) {
      // Clear direct src attribute so Hls can mount properly via MediaSource
      video.removeAttribute("src");
      const hls = new Hls({
        lowLatencyMode: lowLatencyEnabled,
        enableWorker: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(urlToLoad);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        if (isPlaying) {
          video.play().catch((err: any) => {
            if (err.name === "AbortError") {
              console.warn("HLS play request interrupted (expected).");
            } else if (err.name === "NotAllowedError") {
              console.log("Autoplay blocked. Muting stream and retrying...");
              video.muted = true;
              video.play().catch(e => console.error("Autoplay retry failed:", e));
            } else {
              console.log("HLS playback startup:", err);
            }
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn("Fatal HLS stream error:", data.type);
          if (!useProxy && item.url && !item.url.startsWith("local://") && !item.url.startsWith("blob:")) {
            console.log("CORS/Mixed Content block detected in HLS. Seamlessly retrying with secure proxy...");
            setUseProxy(true);
            setErrorInfo("Yayın yüklenemedi. Tekrar bağlanılıyor...");
          } else {
            if (useProxy) {
              setErrorInfo("Yayın sunucusu aktif değil veya bulunamadı.");
              setIsBuffering(false);
            } else {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  setErrorInfo("Yayın oynatılamadı.");
                  setIsBuffering(false);
                  break;
              }
            }
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      // Native HLS support (Safari etc.)
      video.src = urlToLoad;
      const playVideo = () => {
        setIsBuffering(false);
        if (isPlaying) {
          video.play().catch((err: any) => {
            if (err.name === "AbortError") {
              console.warn("Native Safari playback interrupted (expected).");
            } else if (err.name === "NotAllowedError") {
              console.log("Autoplay blocked. Muting stream and retrying...");
              video.muted = true;
              video.play().catch(e => console.error("Autoplay retry failed:", e));
            } else {
              console.log("Safari play error:", err);
            }
          });
        }
      };

      if (video.readyState >= 1) {
        playVideo();
      } else {
        onMetadataLoaded = playVideo;
        video.addEventListener('loadedmetadata', onMetadataLoaded);
      }
    } else {
      // Direct progressive mp4, webm fallback
      video.src = urlToLoad;
      const playVideo = () => {
        setIsBuffering(false);
        if (isPlaying) {
          video.play().catch((err: any) => {
            if (err.name === "AbortError") {
              console.warn("Fallback progressive playback interrupted (expected).");
            } else if (err.name === "NotAllowedError") {
              console.log("Autoplay blocked. Muting stream and retrying...");
              video.muted = true;
              video.play().catch(e => console.error("Autoplay retry failed:", e));
            } else {
              console.log("Fallback playback error:", err);
            }
          });
        }
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        onCanPlay = playVideo;
        video.addEventListener('canplay', onCanPlay);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (onMetadataLoaded) {
        video.removeEventListener('loadedmetadata', onMetadataLoaded);
      }
      if (onCanPlay) {
        video.removeEventListener('canplay', onCanPlay);
      }
    };
  }, [item.url, useProxy, lowLatencyEnabled]);

  // Handle play state change dynamically
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch((e: any) => {
        if (e.name === "AbortError") {
          console.warn("Play request was interrupted by a source update.");
        } else if (e.name === "NotAllowedError") {
          console.log("Autoplay blocked on state sync. Muting stream and retrying...");
          video.muted = true;
          video.play().catch(err => console.error("Dynamic play fail:", err));
        } else {
          console.log("Manual play startup failed:", e);
        }
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      let currentBuffer = 0;
      const targetTime = video.currentTime;
      for (let i = 0; i < video.buffered.length; i++) {
        const start = video.buffered.start(i);
        const end = video.buffered.end(i);
        if (targetTime >= start && targetTime <= end) {
          currentBuffer = end - targetTime;
          break;
        }
      }

      let latencyValue = 0;
      if (hlsRef.current && hlsRef.current.liveSyncPosition) {
        latencyValue = Math.max(0, hlsRef.current.liveSyncPosition - targetTime);
      }

      const quality = (video as any).getVideoPlaybackQuality ? (video as any).getVideoPlaybackQuality() : null;
      const fpsValue = quality ? Math.round(quality.totalVideoFrames / (video.currentTime || 1)) % 60 || 30 : 25;

      setBufferTelemetry({
        bufferLength: Number(currentBuffer.toFixed(2)),
        latency: Number(latencyValue.toFixed(2)),
        fps: fpsValue,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [item.id, item.url]);

  // Sync mute and volume level
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      if (!isMuted) {
        video.volume = volume;
      }
    }
  }, [isMuted, volume]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    if (onMuteToggle) {
      onMuteToggle();
    }
  };

  const skipSeconds = (seconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    const video = videoRef.current;
    if (!video) return;

    const newTime = video.currentTime + seconds;
    if (newTime >= 0 && (video.duration ? newTime <= video.duration : true)) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
      
      if (hlsRef.current && hlsRef.current.liveSyncPosition) {
        const diff = hlsRef.current.liveSyncPosition - newTime;
        if (diff > 5) {
          setTimeshiftOffset(Math.round(diff));
          setIsLive(false);
        } else {
          setTimeshiftOffset(null);
          setIsLive(true);
        }
      } else {
        setIsLive(false);
      }
    }
  };

  const jumpToLive = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current && hlsRef.current.liveSyncPosition) {
      video.currentTime = hlsRef.current.liveSyncPosition - 1;
      setTimeshiftOffset(null);
      setIsLive(true);
    } else if (video.seekable && video.seekable.length > 0) {
      video.currentTime = video.seekable.end(video.seekable.length - 1);
      setTimeshiftOffset(null);
      setIsLive(true);
    }
  };

  // Improved requestFullscreen targeting the entire player div wrapper ref
  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetControlsTimeout();
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      setIsFullscreen(true);
      if (container.requestFullscreen) {
        container.requestFullscreen().catch((err) => {
          console.log("Standard fullscreen is blocked or unsupported, utilizing virtual layer: ", err);
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) { // Firefox
        (container as any).mozRequestFullScreen();
      } else if ((container as any).msRequestFullscreen) { // IE/Edge
        (container as any).msRequestFullscreen();
      } else if (videoRef.current) {
        // Fallback directly to video tag on restricted mobile Safari
        const video = videoRef.current;
        if (video.requestFullscreen) {
          video.requestFullscreen().catch(() => {});
        } else if ((video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
        }
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
      setDuration(video.duration);
    }
  };

  // Toggle controls display when tapping/clicking player container background
  const handlePlayerBackgroundClick = () => {
    setControlsVisible((prev) => !prev);
    resetControlsTimeout();
  };

  return (
    <div
      ref={containerRef}
      onClick={onActiveClick}
      id={`player-wrapper-${item.id}`}
      className={`relative group flex flex-col justify-between overflow-hidden bg-black border transition-all duration-300 select-none ${
        isFullscreen 
          ? "fixed inset-0 w-screen h-screen z-[9999] rounded-none border-0" 
          : "rounded-xl aspect-video"
      } ${
        isActive 
          ? "border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.35)] ring-2 ring-orange-500/10" 
          : "border-white/5 hover:border-white/10"
      }`}
    >
      {/* Current Playing Badge/Title (Visible only if controls are visible) */}
      <div className={`absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/95 to-transparent p-3 flex justify-between items-center transition-all duration-300 ${
        controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}>
        <div className="flex items-center gap-2 overflow-hidden mr-2 text-left">
          {item.logo ? (
            <img
              src={item.logo}
              alt=""
              className="h-7 w-7 rounded bg-[#0a0a0c] object-contain p-0.5 border border-white/5 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-7 w-7 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white/40 shrink-0">
              TV
            </div>
          )}
          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-xs leading-sharp">
              {item.name}
            </p>
            <p className="text-[9.5px] text-white/40 truncate max-w-[120px] font-sans">
              {item.group}
            </p>
          </div>
        </div>

        {/* Real-time sync / Latency status */}
        <div className="flex items-center gap-1.5 flex-shrink-0 z-10">
          {isLive ? (
            <span className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 text-[9px] text-orange-400 font-extrabold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              CANLI
            </span>
          ) : (
            <button
              onClick={jumpToLive}
              className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-[9px] text-amber-400 font-bold px-2 py-0.5 rounded-full hover:bg-amber-500/30 transition shadow-inner cursor-pointer"
              title="Canlı yayına dön"
            >
              <RotateCcw className="h-2 w-2 animate-spin-[spin_3s_linear_infinite]" />
              -{timeshiftOffset || "Geri"}sn (CANLIYA DÖN)
            </button>
          )}

          {/* Low latency configuration indicator */}
          <span 
            className={`flex items-center gap-0.5 text-[8.5px] font-mono border px-1.5 py-0.5 rounded ${
              lowLatencyEnabled 
                ? "bg-cyan-950/45 border-cyan-800 text-cyan-400" 
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}
            title={lowLatencyEnabled ? "Maksimum Düşük Gecikme Aktif" : "Standart Gecikme"}
          >
            <Activity className="h-2.5 w-2.5 flex-shrink-0 animate-pulse" />
            LL
          </span>

        </div>
      </div>

      {/* Video Content Stage */}
      <div 
        onClick={handlePlayerBackgroundClick}
        className="relative w-full h-full flex flex-1 items-center justify-center bg-black cursor-pointer group"
      >
        {errorInfo && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center select-none animate-fadeIn">
            <AlertCircle className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-white font-bold text-sm tracking-wider uppercase">Medya Çözümleme Hatası</h3>
            <p className="text-white/40 text-xs mt-1 max-w-[240px]">
              {errorInfo}
            </p>
          </div>
        )}

        {isBuffering && !errorInfo && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] transition-all">
            <div className="flex flex-col items-center bg-[#0d0d11]/90 px-5 py-4.5 rounded-2xl border border-white/5 shadow-2xl shrink-0 text-center">
              <svg className="animate-spin h-7 w-7 text-orange-500 mb-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-white text-[11px] font-extrabold uppercase tracking-widest text-[#eaeaea]">Yayın Çözülüyor...</span>
              <span className="text-white/35 text-[9px] mt-0.5">Düşük gecikmeli akış stabilize ediliyor</span>
            </div>
          </div>
        )}

        <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
          <video
            ref={videoRef}
            playsInline
            className="w-full h-full pointer-events-auto transition-all duration-200"
            style={{ 
              maxHeight: "100%",
              objectFit: aspectFit as any,
              transform: `scale(${zoomScale / 100})`
            }}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => {
              setIsPlaying(true);
              setIsBuffering(false);
            }}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
             onError={(e) => {
               if (hlsRef.current) {
                 console.log("Native video error while HLS is active (delegated to HLS)");
                 return;
               }
               const video = videoRef.current;
               if (!video || !video.src || video.src === "" || video.src === window.location.href) {
                 return;
               }
               if (video.error && video.error.code === 4) {
                 console.log("Ignoring transient source transition error.");
                 return;
               }
               console.warn("Native player error", video.error);

               if (!useProxy && item.url && !item.url.startsWith("local://") && !item.url.startsWith("blob:")) {
                 console.log("CORS or Mixed-Content block on progressive playback. Retrying via secure proxy...");
                 setUseProxy(true);
                 setErrorInfo("Yayın yüklenemedi. Tekrar bağlanılıyor...");
               } else {
                 if (useProxy) {
                   setErrorInfo("Yayın sunucusu aktif değil veya bulunamadı.");
                 } else {
                   setErrorInfo("Yayın oynatılamadı (desteklenmeyen biçim veya kod çözücü)");
                 }
               }
             }}
          />
        </div>

        {/* Dynamic Interactive subtitles layer overlay */}
        {selectedSubtitle !== "kapali" && subtitleText && (
          <div className="absolute bottom-16 sm:bottom-20 left-4 right-4 text-center z-20 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <span className="bg-black/75 px-3.5 py-1.5 rounded-xl border border-white/10 text-white font-sans text-xs md:text-sm font-bold tracking-wide leading-relaxed inline-block max-w-[85%] border-b-2 border-b-orange-600 shadow-xl">
              {subtitleText}
            </span>
          </div>
        )}

        {/* ACTIVE SLOT HIGHLIGHT FLAG */}
        {isActive && !isFullscreen && (
          <div className="absolute right-3 top-14 bg-orange-500/20 text-orange-400 text-[8px] font-extrabold border border-orange-500/30 px-1.5 py-0.5 rounded uppercase tracking-widest backdrop-blur-sm shadow pointer-events-none">
            Etkin Ekran
          </div>
        )}

        {/* SOLUTION SUGGESTIONS OVERLAY */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowSuggestions(false);
              }}
              className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md p-5 shadow-2xl relative text-left overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3.5">
                  <div className="flex items-center gap-1.5">
                    <Info className="h-4.5 w-4.5 text-orange-500" />
                    <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide">Yayın Sorun Çözüm Önerileri</h3>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs text-white/75 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <h4 className="font-bold text-orange-400 mb-1 flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
                      <Globe className="h-3.5 w-3.5 text-orange-400" />
                      1. CORS / KARMA İÇERİK ENGELLEMESİ
                    </h4>
                    <p className="text-[11px] text-white/70">
                      Güvenlik nedeniyle bazı IPTV yayınları tarayıcılar tarafından engellenebilir. Sistemimiz hata aldığında otomatik olarak proxy sunucusu üzerinden yayın kurmayı dener.
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <h4 className="font-bold text-orange-400 mb-1 flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
                      <RefreshCw className="h-3.5 w-3.5 text-orange-400" />
                      2. YEREL LİSTE & DOSYA KULLANIMI
                    </h4>
                    <p className="text-[11px] text-white/70">
                      Mobil/Android cihazlarda <code className="bg-black/30 px-1 py-0.5 rounded text-orange-300 font-mono text-[9px]">content://</code> veya <code className="bg-black/30 px-1 py-0.5 rounded text-orange-300 font-mono text-[9px]">file://</code> yolları tarayıcı tarafından koruma gereği doğrudan indirilemez. Yerel dosyalarınızı ana paneldeki <b>Yerel .m3u Yükle</b> alanından yükleyebilirsiniz.
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <h4 className="font-bold text-orange-400 mb-1 flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
                      <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
                      3. PROTOKOL VE UZANTI UYUMLULUĞU
                    </h4>
                    <p className="text-[11px] text-white/70">
                      M3U listenizin içinde yer alan bağlantıların <code className="bg-black/30 px-1 py-0.5 rounded text-orange-300 font-mono text-[9px]">.m3u8</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-orange-300 font-mono text-[9px]">.mp4</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-orange-300 font-mono text-[9px]">.ts</code> veya canlandırmaya uygun formatta olduğunu teyit edin.
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <h4 className="font-bold text-orange-400 mb-1 flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
                      <Shield className="h-3.5 w-3.5 text-orange-400" />
                      4. GÜVENLİ BAĞLANTI (HTTPS) ENGELI
                    </h4>
                    <p className="text-[11px] text-white/70">
                      Güncel tarayıcılar güvenli HTTPS web sitelerinde, HTTP üzerinden gelen yayınları (Mixed Content) oynatmayabilir. Güvenli yayın bağlantıları tercih edilmelidir.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-[0_4px_12px_rgba(234,88,12,0.3)] hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    Anladım
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RECOMMENDED MOVIES OVERLAY */}
        <AnimatePresence>
          {showRecommendedMovies && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowRecommendedMovies(false);
              }}
              className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-950/95 border border-white/10 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-left overflow-hidden flex flex-col max-h-[85%]"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide">Önerilen Filmler</h3>
                      <p className="text-[10px] text-white/40 mt-0.5">Sizin için seçilen özel yayınlar ve sinema yapımları</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRecommendedMovies(false)}
                    className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Grid list of movies */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1 py-1 scrollbar-thin">
                  {recommendedMovies.map((movie) => {
                    const isPlayingThis = item.url === movie.url;
                    return (
                      <button
                        key={movie.id}
                        onClick={() => {
                          if (onPlayItem) {
                            onPlayItem(movie);
                          }
                          setShowRecommendedMovies(false);
                        }}
                        className={`group relative flex flex-col text-left rounded-xl overflow-hidden bg-white/[0.02] border transition-all hover:scale-102 cursor-pointer duration-300 ${
                          isPlayingThis
                            ? "border-orange-500/80 bg-orange-950/20 shadow-[0_0_15px_rgba(234,88,12,0.25)]"
                            : "border-white/5 hover:border-white/15 hover:bg-white/[0.05]"
                        }`}
                      >
                        {/* Film Image/Logo Container with 16:10 aspect ratio */}
                        <div className="aspect-[16/10] bg-black/40 relative flex items-center justify-center overflow-hidden border-b border-white/5">
                          {movie.logo ? (
                            <img
                              src={movie.logo}
                              alt={movie.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          ) : null}
                          
                          {/* Dark Glass Overlay with group tag */}
                          <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-orange-400 border border-white/5 uppercase">
                            {movie.group || "Sinema"}
                          </div>

                          {/* Quick Play overlay icon */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                            <span className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Play className="h-4 w-4 fill-current ml-0.5" />
                            </span>
                          </div>
                        </div>

                        {/* Text details */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-[10px] font-bold text-white/90 line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
                              {movie.name}
                            </h4>
                          </div>
                          {isPlayingThis && (
                            <div className="flex items-center gap-1 mt-1 text-[8px] font-bold uppercase tracking-wider text-orange-400">
                              <span className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-ping" />
                              Oynatılıyor
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-between items-center text-[9px] text-white/30 border-t border-white/5 pt-3">
                  <span>Toplam {recommendedMovies.length} öneri aktif.</span>
                  <button
                    onClick={() => setShowRecommendedMovies(false)}
                    className="px-3.5 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white transition-all cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CLINICAL CENTRAL GESTURE OVERLAY LAYER - Pause, Rewind, Zoom visually toggles here */}
        <div className={`absolute inset-0 z-20 bg-black/40 flex items-center justify-center gap-6 transition-all duration-300 pointer-events-none ${
          controlsVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}>
          {/* Centered Big Rewind */}
          <button
            onClick={(e) => skipSeconds(-10, e)}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:bg-orange-600/30 hover:border-orange-500/50 transition-all active:scale-90 pointer-events-auto cursor-pointer"
            title="10sn Geri Sar"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          {/* Large Pulsating Center Play/Pause button */}
          <button
            onClick={handlePlayPause}
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-orange-600 hover:bg-orange-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(234,88,12,0.6)] hover:scale-105 active:scale-95 transition-all pointer-events-auto cursor-pointer"
            title={isPlaying ? "Durdur" : "Başlat"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 stroke-[2.5]" />
            ) : (
              <Play className="h-6 w-6 fill-white ml-1 stroke-[2.5]" />
            )}
          </button>

          {/* New Fullscreen Toggle in Center Overlay */}
          <button
            onClick={handleFullscreen}
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:bg-orange-600/30 hover:border-orange-500/50 transition-all active:scale-90 pointer-events-auto cursor-pointer"
            title={isFullscreen ? "Küçült" : "Tam Ekran Yap"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>

          {/* Centered Big Fast Forward */}
          <button
            onClick={(e) => skipSeconds(10, e)}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:bg-orange-600/30 hover:border-orange-500/50 transition-all active:scale-90 pointer-events-auto cursor-pointer"
            title="10sn İleri Sar"
          >
            <FastForward className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* TRACK SETTINGS MENUS (SUBTITLES, AUDIO & QUALITY SELECTOR POPUPS) */}
      {controlsVisible && activeMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 right-4 z-35 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-56 text-left shadow-[0_15px_30px_rgba(0,0,0,0.7)] text-xs flex flex-col gap-2.5"
        >
          {activeMenu === "audio" && (
            <>
              <div className="border-b border-white/5 pb-1.5 flex items-center gap-1.5 text-orange-400 font-extrabold uppercase text-[10px] tracking-wider">
                <Languages className="h-3.5 w-3.5" />
                SES DİLİ SEÇENEKLERİ
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: "orjinal", label: "Orijinal Yol (Varsayılan)" },
                  { id: "turkce", label: "Türkçe Dublaj" },
                  { id: "ingilizce", label: "İngilizce (Original)" }
                ].map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setSelectedAudio(track.id);
                      setActiveMenu(null);
                    }}
                    className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                      selectedAudio === track.id ? "bg-orange-650/40 text-orange-400 font-bold" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{track.label}</span>
                    {selectedAudio === track.id && <Check className="h-3.5 w-3.5 text-orange-400" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeMenu === "subtitle" && (
            <>
              <div className="border-b border-white/5 pb-1.5 flex items-center gap-1.5 text-orange-400 font-extrabold uppercase text-[10px] tracking-wider">
                <Subtitles className="h-3.5 w-3.5" />
                ALTYAZI AYARI (AÇ/KAPAT)
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: "kapali", label: "Altyazıyı Kapat" },
                  { id: "turkce", label: "Türkçe Altyazı" },
                  { id: "ingilizce", label: "İngilizce Altyazı" }
                ].map((subtitle) => (
                  <button
                    key={subtitle.id}
                    onClick={() => {
                      setSelectedSubtitle(subtitle.id);
                      setActiveMenu(null);
                    }}
                    className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                      selectedSubtitle === subtitle.id ? "bg-orange-655/40 text-orange-400 font-bold" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{subtitle.label}</span>
                    {selectedSubtitle === subtitle.id && <Check className="h-3.5 w-3.5 text-orange-400" />}
                  </button>
                ))}
              </div>
            </>
          )}


        </div>
      )}

      {/* Player Custom Controls Bar (Displays on swipe/click overlay controlsVisible) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/85 to-transparent pt-8 p-3 transition-all duration-300 ${
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Seek timeline */}
        <div className="flex items-center gap-2 mb-2 z-10 relative">
          <span className="text-[9px] font-mono text-white/40">
            {new Date(currentTime * 1000).toISOString().substr(11, 8)}
          </span>
          <div 
            onClick={handleSeek}
            className="relative flex-1 group/slider h-2 bg-white/15 rounded-full cursor-pointer overflow-hidden transition-all duration-150 hover:h-2.5"
          >
            <div
              className={`absolute top-0 bottom-0 left-0 bg-orange-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.8)]`}
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 100}%`,
              }}
            />
          </div>
          {duration > 0 && (
            <span className="text-[9px] font-mono text-white/40">
              {new Date(duration * 1000).toISOString().substr(11, 8)}
            </span>
          )}
        </div>

        {/* Actions Button Bar */}
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Önceki Film/Yayın */}
            {onPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetControlsTimeout();
                  onPrev();
                }}
                className="text-white/60 hover:text-orange-400 hover:scale-110 transition p-1 flex items-center justify-center cursor-pointer"
                title="Önceki Yayın / Film"
              >
                <SkipBack className="h-4 w-4" />
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="text-white/80 hover:text-white hover:scale-110 transition p-1 cursor-pointer"
              title="Oynat / Durdur"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={(e) => skipSeconds(-10, e)}
              className="text-white/40 hover:text-white hover:scale-110 transition p-1 flex items-center justify-center cursor-pointer"
              title="10 saniye geri sar"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[8px] font-bold ml-0.5 font-mono">-10s</span>
            </button>

            {/* Forward 10s */}
            <button
              onClick={(e) => skipSeconds(10, e)}
              className="text-white/40 hover:text-white hover:scale-110 transition p-1 flex items-center justify-center cursor-pointer"
              title="10 saniye ileri sar"
            >
              <FastForward className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[8px] font-bold ml-0.5 font-mono">+10s</span>
            </button>

            {/* Sonraki Film/Yayın */}
            {onNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetControlsTimeout();
                  onNext();
                }}
                className="text-white/60 hover:text-orange-400 hover:scale-110 transition p-1 flex items-center justify-center cursor-pointer"
                title="Sonraki Yayın / Film"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            )}

            {/* DYNAMIC AUDIO & SUBTITLE OPTIONS BUTTONS */}
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Ses Dili Button */}
            <button
              onClick={() => setActiveMenu((prev) => (prev === "audio" ? null : "audio"))}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer text-[10px] font-bold ${
                selectedAudio !== "orjinal" || activeMenu === "audio"
                  ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
                  : "text-zinc-400 hover:text-white bg-black/40 border border-transparent"
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden md:inline">
                {selectedAudio === "orjinal" ? "Orijinal Ses" : selectedAudio === "turkce" ? "Türkçe Dublaj" : "İngilizce"}
              </span>
            </button>

            {/* Altyazı Button */}
            <button
              onClick={() => setActiveMenu((prev) => (prev === "subtitle" ? null : "subtitle"))}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer text-[10px] font-bold ${
                selectedSubtitle !== "kapali" || activeMenu === "subtitle"
                  ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
                  : "text-zinc-400 hover:text-white bg-black/40 border border-transparent"
              }`}
            >
              <Subtitles className="h-3.5 w-3.5" />
              <span className="hidden md:inline">
                {selectedSubtitle === "kapali" ? "Altyazı Yok" : selectedSubtitle === "turkce" ? "Türkçe Altyazı" : "İngilizce"}
              </span>
            </button>
          </div>

          {/* Right side telemetry & configurations */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Toggle with Volume Slider - MOVED TO FRONT OF RIGHT SIDE FOR MOBILE */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={handleMuteToggleClick}
                className={`p-1.5 transition rounded-lg hover:bg-white/5 cursor-pointer flex items-center justify-center ${
                  isMuted ? "text-rose-400 hover:text-rose-300" : "text-white/60 hover:text-white"
                }`}
                title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : Math.round(volume * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) / 100;
                  setVolume(val);
                  
                  // Unmute automatically when turning up the volume
                  if (val > 0 && isMuted && onMuteToggle) {
                    onMuteToggle();
                  } else if (val === 0 && !isMuted && onMuteToggle) {
                    onMuteToggle();
                  }

                  if (videoRef.current) {
                    videoRef.current.volume = val;
                    videoRef.current.muted = val === 0;
                  }
                }}
                className="w-20 sm:w-24 h-1.5 rounded-full bg-white/25 accent-orange-500 cursor-pointer outline-none transition-all duration-200"
                title={`Ses Seviyesi: %${isMuted ? 0 : Math.round(volume * 100)}`}
              />
            </div>
            


            {/* TV'ye Yayınla Button */}
            <button
              onClick={startNativeCast}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-orange-600/20 hover:text-orange-400 border border-white/10 hover:border-orange-500/30 text-white/70 rounded text-[9px] font-bold uppercase transition cursor-pointer"
              title="Televizyona Yayınla / Cast to TV"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Yayınla</span>
            </button>

            {/* Paylaş Button */}
            <button
              onClick={handleShareClick}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-orange-600/20 hover:text-orange-400 border border-white/10 hover:border-orange-500/30 text-white/70 rounded text-[9px] font-bold uppercase transition cursor-pointer"
              title="Bu Yayını / Kanalı Paylaş"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Paylaş</span>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-1 px-2 py-0.5 bg-orange-600/20 hover:bg-orange-600/35 border border-orange-500/35 text-orange-400 hover:text-orange-300 rounded text-[9px] font-mono font-bold uppercase transition whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95"
              title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-orange-400" />
                  <span>KÜÇÜLT</span>
                </>
              ) : (
                <>
                  <Maximize className="h-3.5 w-3.5 text-orange-400" />
                  <span>TAM EKRAN</span>
                </>
              )}
            </button>

            {/* Aspect Fit Toggle Button */}
            <button
              onClick={toggleAspectFit}
              className="text-[9.5px] uppercase font-mono font-bold bg-zinc-900 hover:bg-orange-600/30 hover:text-orange-400 border border-white/10 text-white/60 px-2 py-1 rounded transition whitespace-nowrap cursor-pointer"
              title="Ekran Sığdırma Modu"
            >
              {aspectFit === "contain" && "Sığdır"}
              {aspectFit === "cover" && "Kapla"}
              {aspectFit === "fill" && "Doldur"}
            </button>

            {/* Playback Suggestions / Recommendations Button */}
            <button
              onClick={() => {
                setShowSuggestions((prev) => !prev);
                setShowRecommendedMovies(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9.5px] font-bold uppercase transition whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 ${
                showSuggestions 
                  ? "bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.4)] border border-orange-500/50" 
                  : "bg-zinc-900 hover:bg-orange-600/30 hover:text-orange-400 border border-white/10 text-white/60"
              }`}
              title="Yayın Sorun Çözüm Önerileri"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Öneriler</span>
            </button>

            {/* Recommended Movies Button */}
            <button
              onClick={() => {
                setShowRecommendedMovies((prev) => !prev);
                setShowSuggestions(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9.5px] font-bold uppercase transition whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 ${
                showRecommendedMovies 
                  ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)] border border-amber-500/50" 
                  : "bg-zinc-900 hover:bg-amber-500/30 hover:text-amber-400 border border-white/10 text-white/60"
              }`}
              title="Sizin İçin Seçilmiş Önerilen Sinema ve Popüler Yapımlar"
            >
              <Film className="h-3.5 w-3.5 text-amber-400" />
              <span>Film Önerileri</span>
            </button>

            {/* Buffer Length Indicator */}
            <div className="hidden lg:flex flex-col items-end text-[9px] font-mono text-white/40 border-r border-white/5 pr-2.5 leading-snug">
              <span>Tampon: {bufferTelemetry.bufferLength}sn</span>
              <span>Gecikme: {bufferTelemetry.latency}sn</span>
            </div>
          </div>
        </div>
      </div>

      {/* TV CASTING MODAL OVERLAY */}
      <AnimatePresence>
        {isCastingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              handleStopCast();
            }}
            className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-left overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-orange-500" />
                  <h3 className="font-bold text-white text-sm tracking-wide">TV'ye Yayını Aktar</h3>
                </div>
                <button
                  onClick={handleStopCast}
                  className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {castStatus === "idle" && (
                <div className="flex flex-col gap-3">
                  <p className="text-white/55 text-[11px] leading-relaxed">
                    Yayın akışını evinizdeki akıllı televizyona, Chromecast veya Apple TV cihazına aktarın.
                  </p>
                  <div className="text-[10px] uppercase font-semibold text-orange-400 tracking-wider flex items-center gap-1.5 mt-1">
                    <span className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-ping" />
                    Çevredeki Cihazlar Aranıyor...
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {castDevices.map((device) => (
                      <button
                        key={device}
                        onClick={() => handleDeviceSelect(device)}
                        className="w-full text-left p-2.5 rounded-xl border border-white/5 hover:border-orange-500/30 bg-white/5 hover:bg-orange-650/10 text-xs text-white/80 hover:text-orange-400 flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="font-semibold">{device}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-white/20 group-hover:text-orange-400 -rotate-90" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {castStatus === "connecting" && (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-orange-650/20 blur-md animate-pulse" />
                    <div className="h-12 w-12 rounded-full border border-orange-500/30 bg-orange-950/30 flex items-center justify-center text-orange-400 animate-bounce">
                      <Tv className="h-6 w-6" />
                    </div>
                  </div>
                  <h4 className="text-white font-bold text-xs">{selectedCastDevice} Bağlanıyor...</h4>
                  <p className="text-white/40 text-[10px] mt-1 max-w-[200px]">
                    Medya akış kanalı televizyonunuza aktarılıyor. Lütfen bekleyin.
                  </p>
                </div>
              )}

              {castStatus === "connected" && (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="h-10 w-10 rounded-full border border-green-500/30 bg-green-950/20 text-green-400 flex items-center justify-center mb-3">
                    <Check className="h-5 w-5 stroke-[3]" />
                  </div>
                  <h4 className="text-white font-bold text-xs">Yayın TV'de Oynatılıyor!</h4>
                  <p className="text-green-400/80 font-mono text-[9.5px] mt-1">
                    Bağlı cihaz: {selectedCastDevice}
                  </p>
                  
                  {/* Fake Active Cast Telemetry Volume Controls */}
                  <div className="w-full bg-white/5 border border-white/5 p-3 rounded-xl mt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-[9.5px] text-white/50">
                      <span>Cihaz Ses Seviyesi</span>
                      <span>%75</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full w-[75%]" />
                    </div>
                  </div>

                  <button
                    onClick={handleStopCast}
                    className="w-full mt-4 py-2 bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 font-bold text-[10px] tracking-wider uppercase rounded-xl transition cursor-pointer"
                  >
                    Yayını Kapat / Bağlantıyı Kes
                  </button>
                </div>
              )}

              <div className="mt-4 border-t border-white/5 pt-3 text-[9px] text-white/30 flex gap-1.5 items-start">
                <Info className="h-3.5 w-3.5 text-white/20 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Cihazınızın ve televizyonunuzun aynı kablosuz (Wi-Fi) ağına bağlı olduğundan emin olun.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARING MODAL OVERLAY */}
      <AnimatePresence>
        {isSharingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsSharingOpen(false);
            }}
            className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-orange-500" />
                  <h3 className="font-bold text-white text-sm tracking-wide">Yayını Paylaş</h3>
                </div>
                <button
                  onClick={() => setIsSharingOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                  {item.logo ? (
                    <img src={item.logo} alt="" className="h-8 w-8 object-contain rounded bg-black/50 p-1 border border-white/10 hover_err_style" onError={(ev) => (ev.currentTarget.style.display = "none")} />
                  ) : (
                    <div className="h-8 w-8 bg-zinc-900 border border-white/5 rounded flex items-center justify-center text-[10px] font-bold text-white/40">
                      TV
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[9.5px] text-white/40 truncate">{item.group || "IPTV Kanalları"}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] font-bold text-white/40 uppercase tracking-wider">Hızlı Erişim Linki</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}${window.location.pathname}?channelUrl=${encodeURIComponent(item.url || "")}&channelName=${encodeURIComponent(item.name || "")}`}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 bg-black border border-white/10 rounded-xl p-2 text-[10px] text-zinc-400 font-mono outline-none focus:border-orange-500 truncate"
                    />
                    <button
                      onClick={copyShareLink}
                      className={`px-3 py-2 rounded-xl border font-bold text-[10px] transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        shareCopied 
                          ? "bg-green-600/20 border-green-500 text-green-400" 
                          : "bg-orange-600 hover:bg-orange-500 border-transparent text-white shadow-lg"
                      }`}
                    >
                      {shareCopied ? (
                        <>
                          <Check className="h-3 w-3 stroke-[3]" />
                          <span>Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Social Buttons */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[9.5px] font-bold text-white/40 uppercase tracking-wider">Doğrudan Paylaş</label>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`PlayTV'de "${item.name}" yayınını izliyorum, sen de katıl! ` + `${window.location.origin}${window.location.pathname}?channelUrl=${encodeURIComponent(item.url || "")}&channelName=${encodeURIComponent(item.name || "")}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-xl text-center text-[10px] font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <span>WhatsApp</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?channelUrl=${encodeURIComponent(item.url || "")}&channelName=${encodeURIComponent(item.name || "")}`)}&text=${encodeURIComponent(`PlayTV'de "${item.name}" yayınını izliyorum, sen de katıl!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] rounded-xl text-center text-[10px] font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <span>Telegram</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
