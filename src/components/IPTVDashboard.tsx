import React, { useEffect, useState, useMemo } from "react";
import { 
  Tv, 
  Search, 
  Heart, 
  Trash2, 
  Grid, 
  List,
  Layers,
  Activity, 
  TrendingUp, 
  Video, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Minimize2,
  ListFilter,
  User,
  Settings,
  Film,
  Compass,
  Volume2,
  Sliders,
  ChevronRight,
  Monitor,
  Menu,
  X,
  Plus,
  Edit,
  Check,
  Info,
  FolderPlus,
  ListCollapse,
  ChevronDown,
  Sun,
  Moon,
  Upload,
  Download,
  FileText,
  SkipBack,
  SkipForward
} from "lucide-react";
import { IPlaylistItem, IScreenSlot, getApiUrl, isStaticSite } from "../types";
import VideoPlayer from "./VideoPlayer";

interface IM3UPlaylist {
  id: string;
  name: string;
  url: string;
}

export const ACCENT_THEME_PRESETS: Record<string, {
  name: string;
  colorName: string;
  primary: string; 
  hover: string;   
  active: string;  
  text: string;    
  bg: string;      
  bgDark: string;  
  glow: string;   
  textColorClass: string;
  bgColorClass: string;
}> = {
  cyan: {
    name: "Aero Cyan (Siber Turkuaz)",
    colorName: "Turkuaz",
    primary: "#06b6d4",
    hover: "#0891b2",
    active: "#22d3ee",
    text: "#22d3ee",
    bg: "rgba(6, 182, 212, 0.2)",
    bgDark: "#083344",
    glow: "6, 182, 212",
    textColorClass: "text-cyan-400",
    bgColorClass: "bg-cyan-550"
  },
  emerald: {
    name: "Liquid Emerald (Konforlu Yeşil)",
    colorName: "Zümrüt Yeşili",
    primary: "#10b981",
    hover: "#059669",
    active: "#34d399",
    text: "#34d399",
    bg: "rgba(16, 185, 129, 0.2)",
    bgDark: "#064e3b",
    glow: "16, 185, 129",
    textColorClass: "text-emerald-400",
    bgColorClass: "bg-emerald-550"
  },
  violet: {
    name: "Sunset Violet (Siber Pembe-Mor)",
    colorName: "Asil Mor",
    primary: "#8b5cf6",
    hover: "#7c3aed",
    active: "#a78bfa",
    text: "#a78bfa",
    bg: "rgba(139, 92, 246, 0.2)",
    bgDark: "#2e1065",
    glow: "139, 92, 246",
    textColorClass: "text-violet-400",
    bgColorClass: "bg-violet-550"
  },
  blue: {
    name: "Deep Cobalt (Pasifik Akıntısı)",
    colorName: "Derin Mavi",
    primary: "#3b82f6",
    hover: "#2563eb",
    active: "#60a5fa",
    text: "#60a5fa",
    bg: "rgba(59, 130, 246, 0.2)",
    bgDark: "#172554",
    glow: "59, 130, 246",
    textColorClass: "text-blue-400",
    bgColorClass: "bg-blue-550"
  },
  orange: {
    name: "Volcanic Orange (Lava Ateşi)",
    colorName: "Klasik Amber",
    primary: "#ea580c",
    hover: "#d97706",
    active: "#f97316",
    text: "#f97316",
    bg: "rgba(234, 88, 12, 0.2)",
    bgDark: "#431407",
    glow: "234, 88, 12",
    textColorClass: "text-orange-400",
    bgColorClass: "bg-orange-550"
  }
};

export default function IPTVDashboard() {
  const [accentTheme, setAccentTheme] = useState<string>(() => {
    return localStorage.getItem("iptv_accent_theme") || "cyan";
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("iptv_theme") as "dark" | "light") || "dark";
  });

  const [layoutMode, setLayoutMode] = useState<"grid" | "list" | "karo">(() => {
    return (localStorage.getItem("iptv_layout_mode") as "grid" | "list" | "karo") || "grid";
  });

  // Dynamically update document element CSS variables when accentTheme changes
  useEffect(() => {
    const activePreset = ACCENT_THEME_PRESETS[accentTheme] || ACCENT_THEME_PRESETS.cyan;
    const root = document.documentElement;
    root.style.setProperty("--accent-primary", activePreset.primary);
    root.style.setProperty("--accent-hover", activePreset.hover);
    root.style.setProperty("--accent-active", activePreset.active);
    root.style.setProperty("--accent-text", activePreset.text);
    root.style.setProperty("--accent-bg", activePreset.bg);
    root.style.setProperty("--accent-bg-dark", activePreset.bgDark);
    root.style.setProperty("--accent-glow-rgb", activePreset.glow);
  }, [accentTheme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("iptv_theme", nextTheme);
  };

  const [savedPlaylists, setSavedPlaylists] = useState<IM3UPlaylist[]>(() => {
    const defaults = [
      {
        id: "1",
        name: "Varsayılan Film Listesi (Çevrimdışı - Yedek Aktif)",
        url: "https://cdn.jsdelivr.net/gh/Playtvapp/Playtvlist@main/F%C4%B0LMLERFANT%C4%B0KAPPP.m3u"
      },
      {
        id: "2",
        name: "IPTV-Org Türkiye TV (Süper Kararlı)",
        url: "https://iptv-org.github.io/iptv/countries/tr.m3u"
      },
      {
        id: "3",
        name: "Popüler Türkiye Canlı TV (FurkanYurt)",
        url: "https://raw.githubusercontent.com/FurkanYurt/m3u8/main/TR.m3u"
      }
    ];

    try {
      const stored = localStorage.getItem("iptv_saved_playlists");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If they only have the old 1-item default, migrate to the list with fallbacks
          if (parsed.length === 1 && parsed[0].id === "1" && !parsed[0].name.includes("Çevrimdışı")) {
            localStorage.setItem("iptv_saved_playlists", JSON.stringify(defaults));
            return defaults;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }

    try {
      localStorage.setItem("iptv_saved_playlists", JSON.stringify(defaults));
    } catch (e) {}
    return defaults;
  });

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistUrl, setNewPlaylistUrl] = useState("");
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingUrl, setEditingUrl] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Input playlist URL, prefilled with user requested link
  const [playlistInput, setPlaylistInput] = useState<string>(() => {
    try {
      const storedActive = localStorage.getItem("iptv_active_playlist_url");
      if (storedActive) return storedActive;
      const storedLists = localStorage.getItem("iptv_saved_playlists");
      if (storedLists) {
        const parsed = JSON.parse(storedLists);
        if (parsed.length > 0) return parsed[0].url;
      }
    } catch (e) {
      console.error(e);
    }
    return "https://cdn.jsdelivr.net/gh/Playtvapp/Playtvlist@main/F%C4%B0LMLERFANT%C4%B0KAPPP.m3u";
  });
  
  const [currentPlaylistUrl, setCurrentPlaylistUrl] = useState<string>(() => {
    try {
      const storedActive = localStorage.getItem("iptv_active_playlist_url");
      if (storedActive) return storedActive;
      const storedLists = localStorage.getItem("iptv_saved_playlists");
      if (storedLists) {
        const parsed = JSON.parse(storedLists);
        if (parsed.length > 0) return parsed[0].url;
      }
    } catch (e) {
      console.error(e);
    }
    return "https://cdn.jsdelivr.net/gh/Playtvapp/Playtvlist@main/F%C4%B0LMLERFANT%C4%B0KAPPP.m3u";
  });

  const [items, setItems] = useState<IPlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [fallbackErrorNote, setFallbackErrorNote] = useState<string>("");
  const [isFileDragging, setIsFileDragging] = useState(false);

  // Filter Categories & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("Hepsi");
  const [searchQuery, setSearchQuery] = useState("");

  // Favorites (Stored in localStorage)
  const [favorites, setFavorites] = useState<IPlaylistItem[]>(() => {
    try {
      const storedFav = localStorage.getItem("iptv_favorites");
      if (storedFav) return JSON.parse(storedFav);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Multi-Screen arrangement
  const [activeSlotId, setActiveSlotId] = useState<number>(0);
  const [screenLayout, setScreenLayout] = useState<"single" | "dual" | "quad">("single");
  const [lowLatencyEnabled, setLowLatencyEnabled] = useState<boolean>(true);

  // Active navigation sidebar tab
  const [activeTab, setActiveTab] = useState<"canli" | "favoriler" | "ayarlar">("canli");

  // Pagination / Limit state to prevent rendering thousands of items at once which freezes the browser tab
  const [visibleCount, setVisibleCount] = useState<number>(60);

  // Reset pagination when category, search query, or active tab changes to load views instantly
  useEffect(() => {
    setVisibleCount(60);
  }, [selectedCategory, searchQuery, activeTab]);

  // Screen slots configuration
  const [screenSlots, setScreenSlots] = useState<IScreenSlot[]>([
    { id: 0, item: null, isMuted: false, isPlaying: true, playbackSpeed: 1.0, lowLatencyEnabled: true },
    { id: 1, item: null, isMuted: true, isPlaying: true, playbackSpeed: 1.0, lowLatencyEnabled: true },
    { id: 2, item: null, isMuted: true, isPlaying: true, playbackSpeed: 1.0, lowLatencyEnabled: true },
    { id: 3, item: null, isMuted: true, isPlaying: true, playbackSpeed: 1.0, lowLatencyEnabled: true },
  ]);

  const addPlaylist = (name: string, url: string) => {
    if (!name.trim() || !url.trim()) return;
    const newPl: IM3UPlaylist = {
      id: Date.now().toString(),
      name: name.trim(),
      url: url.trim()
    };
    const nextList = [...savedPlaylists, newPl];
    setSavedPlaylists(nextList);
    localStorage.setItem("iptv_saved_playlists", JSON.stringify(nextList));
    selectPlaylist(newPl.url);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      const fileId = Date.now().toString();
      const playlistName = file.name.replace(/\.[^/.]+$/, "") || "Yüklenen Playlist";
      const playlistUrl = `local://${fileId}`;
      
      // Save content into localStorage
      localStorage.setItem(`iptv_playlist_text_${fileId}`, text);
      
      addPlaylist(playlistName, playlistUrl);
    };
    reader.onerror = () => {
      setError("Dosya okuma başarısız oldu.");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const selectPlaylist = (url: string) => {
    setCurrentPlaylistUrl(url);
    setPlaylistInput(url);
    localStorage.setItem("iptv_active_playlist_url", url);
  };

  const deletePlaylist = (id: string) => {
    const deletedPl = savedPlaylists.find(pl => pl.id === id);
    if (deletedPl && deletedPl.url.startsWith("local://")) {
      const fileId = deletedPl.url.replace("local://", "");
      localStorage.removeItem(`iptv_playlist_text_${fileId}`);
    }

    const nextList = savedPlaylists.filter(pl => pl.id !== id);
    setSavedPlaylists(nextList);
    localStorage.setItem("iptv_saved_playlists", JSON.stringify(nextList));
    
    // Fallback if deleted playlist was active
    if (deletedPl && deletedPl.url === currentPlaylistUrl) {
      if (nextList.length > 0) {
        selectPlaylist(nextList[0].url);
      } else {
        const defaultUr = "https://cdn.jsdelivr.net/gh/Playtvapp/Playtvlist@main/F%C4%B0LMLERFANT%C4%B0KAPPP.m3u";
        selectPlaylist(defaultUr);
      }
    }
  };

  const updatePlaylist = (id: string, newName: string, newUrl: string) => {
    if (!newName.trim() || !newUrl.trim()) return;
    const nextList = savedPlaylists.map(pl => {
      if (pl.id === id) {
        return { ...pl, name: newName.trim(), url: newUrl.trim() };
      }
      return pl;
    });
    setSavedPlaylists(nextList);
    localStorage.setItem("iptv_saved_playlists", JSON.stringify(nextList));
    
    const updatedPl = nextList.find(pl => pl.id === id);
    if (updatedPl && updatedPl.url === currentPlaylistUrl) {
      selectPlaylist(newUrl.trim());
    }
    setEditingPlaylistId(null);
  };

  // Client-side local parser fallback for GitHub Pages compatibility and server outages
  const parseM3UContentClient = (text: string): IPlaylistItem[] => {
    const lines = text.split(/\r?\n/);
    const parsedItems: IPlaylistItem[] = [];
    let currentItem: Partial<IPlaylistItem> = {};
    let idCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("#EXTINF:")) {
        currentItem = {};
        const commaIdx = line.lastIndexOf(",");
        let channelName = "Bilinmeyen Kanal";
        if (commaIdx !== -1) {
          channelName = line.substring(commaIdx + 1).trim();
        }

        const logoMatch = line.match(/tvg-logo="([^"]+)"/) || line.match(/logo="([^"]+)"/);
        const logo = logoMatch ? logoMatch[1] : "";

        const groupMatch = line.match(/group-title="([^"]+)"/) || line.match(/category="([^"]+)"/);
        const group = groupMatch ? groupMatch[1] : "Genel";

        currentItem.name = channelName;
        currentItem.logo = logo;
        currentItem.group = group;
        currentItem.id = `ch-${idCounter++}-${Date.now()}`;
      } else if (line.startsWith("#EXTGRP:")) {
        const groupValue = line.replace("#EXTGRP:", "").trim();
        if (currentItem && groupValue) {
          currentItem.group = groupValue;
        }
      } else if (line.startsWith("#")) {
        continue;
      } else {
        if (line.match(/^https?:\/\//i) || line.includes("://") || line.includes("/")) {
          if (!currentItem.name) {
            let fallbackName = `Kanal ${idCounter}`;
            try {
              const u = new URL(line);
              const pathname = u.pathname;
              const lastPart = pathname.substring(pathname.lastIndexOf('/') + 1);
              if (lastPart) {
                fallbackName = decodeURIComponent(lastPart.replace(/\.[^/.]+$/, "")).trim();
              }
            } catch (e) {}
            currentItem.name = fallbackName || `Yayın ${idCounter}`;
            currentItem.logo = "";
            currentItem.group = "Genel";
            currentItem.id = `ch-${idCounter++}-${Date.now()}`;
          }
          currentItem.url = line;
          const isSonEklenenler = currentItem.group && currentItem.group.toLowerCase().trim() === "son eklenenler";
          if (!isSonEklenenler) {
            parsedItems.push(currentItem as IPlaylistItem);
          }
          currentItem = {};
        }
      }
    }
    return parsedItems;
  };

  // Fetch playlist items from API proxy
  const fetchPlaylist = async (urlToFetch: string) => {
    setIsLoading(true);
    setError(null);
    setIsUsingFallback(false);
    setFallbackErrorNote("");
    try {
      if (urlToFetch.startsWith("local://")) {
        const fileId = urlToFetch.replace("local://", "");
        const rawText = localStorage.getItem(`iptv_playlist_text_${fileId}`) || "";
        if (!rawText) {
          throw new Error("Yerel yüklenen liste içeriği boş veya silinmiş.");
        }
        // Direct browser client-side parse (offline friendly & static site safe)
        const clientItems = parseM3UContentClient(rawText);
        if (clientItems.length === 0) {
          throw new Error("Yerel listede geçerli bir kanal veya yayın adresi bulunamadı.");
        }
        setItems(clientItems);
        // Auto play the first item in the first slot if empty
        if (clientItems.length > 0 && !screenSlots[0].item) {
          setScreenSlots(prev => prev.map((slot, i) => i === 0 ? { ...slot, item: clientItems[0] } : slot));
        }
        return;
      }

      // Remote file parsing branch
      let fetchedItems: IPlaylistItem[] = [];

      if (isStaticSite) {
        console.log("Static site detected (GitHub Pages). Bypassing backend parser, running pure client-side fetching.");
        
        let m3uText = "";
        let fetchSuccess = false;
        
        // Step 1: Direct fetch from the browser
        try {
          console.log("[Client Fetch] Attempting direct fetch:", urlToFetch);
          const directResponse = await fetch(urlToFetch);
          if (directResponse.ok) {
            m3uText = await directResponse.text();
            fetchSuccess = true;
            console.log("[Client Fetch] Direct fetch succeeded!");
          }
        } catch (e) {
          console.warn("[Client Fetch] Direct fetch failed (CORS block expected):", e);
        }

        // Step 2: Fallback to corsproxy.io
        if (!fetchSuccess) {
          try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlToFetch)}`;
            console.log("[Client Fetch] Attempting fetch via corsproxy.io:", proxyUrl);
            const proxyResponse = await fetch(proxyUrl);
            if (proxyResponse.ok) {
              m3uText = await proxyResponse.text();
              fetchSuccess = true;
              console.log("[Client Fetch] Proxy fetch (corsproxy) succeeded!");
            }
          } catch (e) {
            console.warn("[Client Fetch] Proxy fetch (corsproxy) failed:", e);
          }
        }

        // Step 3: Fallback to api.allorigins.win JSON proxy
        if (!fetchSuccess) {
          try {
            const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlToFetch)}`;
            console.log("[Client Fetch] Attempting fetch via AllOrigins proxy:", allOriginsUrl);
            const response = await fetch(allOriginsUrl);
            if (response.ok) {
              const data = await response.json();
              if (data.contents) {
                m3uText = data.contents;
                fetchSuccess = true;
                console.log("[Client Fetch] Proxy fetch (AllOrigins) succeeded!");
              }
            }
          } catch (e) {
            console.warn("[Client Fetch] Proxy fetch (AllOrigins) failed:", e);
          }
        }

        if (fetchSuccess && m3uText) {
          const clientItems = parseM3UContentClient(m3uText);
          if (clientItems.length > 0) {
            fetchedItems = clientItems;
          } else {
            throw new Error("M3U listesi indirildi ancak içerisinden geçerli bir yayın bağlantısı çözümlenemedi.");
          }
        } else {
          throw new Error("M3U listeniz indirilemedi. Bu durum, yayın listesi sunucusunun kapalı olmasından veya güvenlik engellemesinden (CORS) kaynaklanıyor olabilir. Lütfen .m3u dosyasını kaydedip doğrudan yükleyin (Dosya Sürükle-Bırak).");
        }
      } else {
        try {
          // Try calling the Express Server proxy backend first (for CORS bypass & fallback logic)
          const parsedUrl = getApiUrl(`/api/parse-m3u?url=${encodeURIComponent(urlToFetch)}`);
          const response = await fetch(parsedUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.items)) {
              fetchedItems = data.items;
              setIsUsingFallback(!!data.isFallback);
              if (data.errorNote) {
                setFallbackErrorNote(data.errorNote);
              }
            } else {
              throw new Error(data.error || "Playlist parse edilmedi.");
            }
          } else {
            throw new Error(`Server status: ${response.status}`);
          }
        } catch (serverErr) {
          console.warn("Express server API failed or is not available. Falling back to client-side direct fetch...", serverErr);
          // Fallback: If hosted on GitHub Pages (static site) or server is down/unreachable, fetch directly from browser!
          const directResponse = await fetch(urlToFetch);
          if (!directResponse.ok) {
            throw new Error(`Yayın listesi doğrudan indirilemedi (${directResponse.status}). CORS engellemesi veya geçersiz link olabilir. Lütfen .m3u dosyasını indirin ve doğrudan siteye yükleyin.`);
          }
          const text = await directResponse.text();
          const clientItems = parseM3UContentClient(text);
          if (clientItems.length === 0) {
            throw new Error("M3U dosyası içerisinde geçerli bir yayın bağlantısı bulunamadı.");
          }
          fetchedItems = clientItems;
        }
      }

      if (fetchedItems.length > 0) {
        setItems(fetchedItems);
        // Auto play the first item in the first slot if empty
        if (fetchedItems.length > 0 && !screenSlots[0].item) {
          setScreenSlots(prev => prev.map((slot, i) => i === 0 ? { ...slot, item: fetchedItems[0] } : slot));
        }
      } else {
        throw new Error("Kanal listesi boş veya ayrıştırılamadı.");
      }
    } catch (err: any) {
      console.error("Fetch list error", err);
      setError(
        err.message || 
        "Playlist yüklenirken bir hata oluştu. Lütfen bağlantı adresini kontrol edip tekrar deneyin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger playlist fetch on mount or playlist url change
  useEffect(() => {
    fetchPlaylist(currentPlaylistUrl);
  }, [currentPlaylistUrl]);

  // Check for shared channel URL and name in URL Query Parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("channelUrl");
    const sharedName = params.get("channelName");
    if (sharedUrl && sharedName) {
      const decodedUrl = decodeURIComponent(sharedUrl);
      const decodedName = decodeURIComponent(sharedName);
      
      const sharedItem: IPlaylistItem = {
        id: "shared-channel-" + Date.now(),
        name: decodedName,
        url: decodedUrl,
        group: "Paylaşılan Yayın",
        logo: ""
      };
      
      // Load this channel directly into slot 0 and activate/focus it
      setScreenSlots(prev => prev.map((slot, i) => i === 0 ? { 
        ...slot, 
        item: sharedItem, 
        isPlaying: true, 
        isMuted: false 
      } : slot));
      setActiveSlotId(0);
      
      // Clean up parameters in address bar to keep shared link clean for the user
      try {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {
        console.warn("Could not clean up url params", e);
      }
    }
  }, []);

  // Toggle favorite channel
  const toggleFavorite = (item: IPlaylistItem) => {
    let nextFavorites: IPlaylistItem[] = [];
    const isAlreadyFavorited = favorites.some((fav) => fav.id === item.id);
    
    if (isAlreadyFavorited) {
      nextFavorites = favorites.filter((fav) => fav.id !== item.id);
    } else {
      nextFavorites = [...favorites, item];
    }
    
    setFavorites(nextFavorites);
    localStorage.setItem("iptv_favorites", JSON.stringify(nextFavorites));
  };

  // Clear favorites list completely
  const clearAllFavorites = () => {
    setFavorites([]);
    localStorage.removeItem("iptv_favorites");
  };

  // Generate categories from loaded items
  const categories = useMemo(() => {
    const list = new Set<string>();
    items.forEach((item) => {
      if (item.group) list.add(item.group);
    });
    return Array.from(list).sort();
  }, [items]);

  // Generate metadata and short overview/description for playing channels and films
  const activeItemMetadata = useMemo(() => {
    const activeItem = screenSlots[activeSlotId]?.item || screenSlots[0]?.item;
    if (!activeItem) return null;

    const nameLower = activeItem.name.toLowerCase();
    
    // Extract year from title if available (like ... 2023 ... or (2022))
    const yearMatch = activeItem.name.match(/\b(19\d\d|20\d\d)\b/);
    const year = yearMatch ? yearMatch[0] : "2024";
    
    // High stability pseudorandom seed based on characters
    let charSum = 0;
    for (let i = 0; i < activeItem.name.length; i++) {
      charSum += activeItem.name.charCodeAt(i);
    }
    const rating = (6.8 + (charSum % 23) / 10).toFixed(1);
    const durationMin = 95 + (charSum % 40);
    
    // Genres / Themes
    let genre = activeItem.group || "Sinema / Kültür";
    if (genre.toLowerCase().includes("aksiyon")) genre = "Aksiyon & Macera";
    else if (genre.toLowerCase().includes("komedi")) genre = "Komedi & Kahkaha";
    else if (genre.toLowerCase().includes("korku")) genre = "Korku & Gerilim";
    else if (genre.toLowerCase().includes("belgesel")) genre = "Belgesel & Doğa";
    else if (genre.toLowerCase().includes("spor")) genre = "Canlı Spor Gündemi";
    
    const isLiveChannel = !nameLower.includes("film") && 
                          !nameLower.includes("sinema") && 
                          !activeItem.group.toLowerCase().includes("film") && 
                          !activeItem.group.toLowerCase().includes("cinema") && 
                          !activeItem.group.toLowerCase().includes("movie");
    
    let description = "";
    if (isLiveChannel) {
      if (nameLower.includes("haber") || nameLower.includes("trt")) {
        description = `"${activeItem.name}" canlı haber akışı. Türkiye ve dünya gündemindeki son gelişmeleri tarafsız, doğru ve kesintisiz bültenlerle aktaran 24 saat aktif haber yayını. Haber analizleri ve özel konuklarla gündemi anlık takip edin.`;
      } else if (nameLower.includes("spor") || nameLower.includes("bein") || nameLower.includes("fit")) {
        description = `"${activeItem.name}" canlı spor kanalı. Dünyadaki en önemli karşılaşmalar, lig maçları, canlı analizler, spor bültenleri ve dinamik stüdyo programları yüksek performans ve akış kalitesiyle ekranda.`;
      } else if (nameLower.includes("belgesel") || nameLower.includes("nat") || nameLower.includes("wild")) {
        description = `"${activeItem.name}" canlı belgesel kanalı. Tarih, bilim, doğa, uzay ve vahşi yaşam dünyasından nefes kesen çekimler ile Türkçe seslendirmeli en iyi macera kuşağı parmaklarınızın ucunda.`;
      } else if (nameLower.includes("çocuk") || nameLower.includes("cartoon") || nameLower.includes("trt çocuk")) {
        description = `"${activeItem.name}" canlı çocuk yayını. En sevilen çizgi diziler, eğlendirirken eğiten programlar ve pedagojik olarak onaylanmış güvenli yayın kuşağı ile minik izleyicilerin favorisi.`;
      } else {
        description = `"${activeItem.name}" canlı yayın akışı. Yüksek çözünürlüklü görüntü kalitesi, Dolby Digital Plus ses uyumluluğu ve kesintisiz HLS akış hızıyla şimdi ekranda. Canlı bültenler ve her an güncellenen programları kaçırmayın.`;
      }
    } else {
      // Dynamic plot generation based on movie title text analysis
      const lower = activeItem.name.toLowerCase();
      const groupLower = activeItem.group.toLowerCase();
      
      if (lower.includes("gaddar") || lower.includes("mafya") || lower.includes("tetikçi") || lower.includes("suç") || lower.includes("john wick") || lower.includes("intikam")) {
        description = `Yeraltı dünyasının acımasız kurallarına karşı kendi adaletini arayan bir adamın nefes kesen öyküsü. Sevdiklerini korumak için elini kana bulamaktan çekinmeyen kahramanımız, her köşe başında pusu kuran düşmanlarıyla amansız bir savaşa girerken, geçmişin hayaletleriyle de yüzleşiyor. Aksiyon ve intikam dolu bir başyapıt.`;
      } else if (lower.includes("hızlı") || lower.includes("öfkeli") || lower.includes("yarış") || lower.includes("hız") || lower.includes("otoban") || lower.includes("araba") || lower.includes("fast")) {
        description = `Sessiz sokakları gürleyen motor sesleriyle sarsan efsanevi bir yarış çetesinin tehlikeli mücadelesi. Son bir büyük soygun için bir araya gelen ekip, yüksek teknolojiye sahip araçlarıyla amansız bir kovalamacanın ortasında kalıyor. Hız, dostluk ve adrenalin dolu sahneler bir arada.`;
      } else if (lower.includes("örümcek") || lower.includes("örümcek adam") || lower.includes("spider") || lower.includes("batman") || lower.includes("kahraman") || lower.includes("yenilmezler") || lower.includes("marvel") || lower.includes("iron man") || lower.includes("avengers") || lower.includes("süper")) {
        description = `Sıra dışı güçlere sahip bir süper kahramanın, şehri karanlığa sürüklemek isteyen acımasız düşmanlara karşı verdiği destansı mücadele. Kendi iç dünyasındaki karmaşayı ve kimliğini gizleme baskısını bir kenara bırakarak, masum insanların tek umudu haline gelen karakterimizin nefes kesen görsel efektlerle süslü serüveni.`;
      } else if (lower.includes("korku") || lower.includes("ruh") || lower.includes("cin") || lower.includes("şeytan") || lower.includes("testere") || lower.includes("ölüm") || lower.includes("gerilim") || lower.includes("çığlık") || lower.includes("lanet")) {
        description = `Karanlık sırlar barındıran lanetli bir bölgedeki esrarengiz olayları keşfe çıkan beş gencin soluksuz gerilim dolu hikayesi. Görünmez şeytani güçlerin ve ürpertici doğaüstü olayların kıskacında kalan grup için hayatta kalmak, her saniye daha da imkansız hale geliyor. Gerim gerim geren, sinirlerinizi altüst edecek türden bir kurgu.`;
      } else if (lower.includes("komedi") || lower.includes("kahkaha") || lower.includes("komik") || lower.includes("düğün") || lower.includes("şaban") || lower.includes("recep") || lower.includes("ivedik") || lower.includes("cem yılmaz")) {
        description = `Beklenmedik talihsizlikler ve komik yanlış anlaşılmalar zinciriyle hayatları altüst olan bir grup sevimli karakterin kahkaha dolu macerası. Dostluk, aile ilişkileri ve hayata neşeyle bakabilmenin sıcak anlatımıyla bezenmiş, her sahnesiyle yüzünüzü güldürmeyi garanti eden muhteşem bir komedi kuşağı.`;
      } else if (lower.includes("aşk") || lower.includes("romantik") || lower.includes("sevgi") || lower.includes("kalp") || lower.includes("rüya") || lower.includes("müzik") || lower.includes("ayrılık")) {
        description = `Yolları beklenmedik bir şekilde kesişen iki farklı insanın, tüm toplumsal engellere ve zorluklara rağmen yeşerttikleri tutkulu aşk öyküsü. Kalbinizi ısıtacak melodilerle bezeli, fedakarlık ve hafızalardan silinmeyecek anlarla dolu duygu yüklü, dokunaklı bir sevgi belgeseli.`;
      } else if (lower.includes("uzay") || lower.includes("yıldız") || lower.includes("bilim kurgu") || lower.includes("sci-fi") || lower.includes("mars") || lower.includes("gezegen") || lower.includes("teknoloji") || lower.includes("gelecek") || lower.includes("yıldızlararası")) {
        description = `Zaman bükülmeleri ve derin kozmik sırları barındıran yapım, bilim kurgu türüne yeni bir soluk getiriyor. İnsanlığın geleceğini belirleyecek gizemli oluşumu karadeliklerin ötesinde çözmeye çalışan cesur bir astronot ekibinin galaksiler arası destansı yolculuğu her anıyla heyecan verici.`;
      } else if (lower.includes("tarih") || lower.includes("diriliş") || lower.includes("savaş") || lower.includes("fatih") || lower.includes("asker") || lower.includes("ordu") || lower.includes("imparator") || lower.includes("osmanlı")) {
        description = `Tarihin seyrini değiştiren kritik bir dönemece ışık tutan yapım, gerçek yaşanmış belgelere dayalı epik bir kahramanlık mücadelesini anlatıyor. Ülke savunması, sadakat, vatan sevgisi ve insan iradesinin kırılmaz gücünün görkemli savaş sahneleriyle birleştiği dev bütçeli tarihi sinema filmi.`;
      } else if (lower.includes("belgesel") || lower.includes("tarih") || groupLower.includes("belgesel") || groupLower.includes("documentary")) {
        description = `Eşsiz doğa manzaraları, vahşi yaşamın bilinmeyen detayları ve tarihin gizemli kalıntıları arasında büyüleyici bir keşif yolculuğu. Sürükleyici anlatımı ve çarpıcı görüntü yönetmenliğiyle izleyicileri şaşkına çeviren, ufuk açıcı bir belgesel serisi.`;
      } else {
        const fallbacks = [
          `"${activeItem.name}"; sürükleyici senaryosu, çarpıcı temposu ve sarsıcı sahneleriyle sinemaseverlerin büyük beğenisini toplayan son derece başarılı bir yapım.`,
          `Görsel zenginliği ve güçlü oyunculuk performanslarıyla öne çıkan "${activeItem.name}", derin karakter gelişimleri ve beklenmedik olay kurgusu ile izleyicisini büyüleyici bir serüvene davet ediyor.`,
          `Sıra dışı hikaye anlatımı ve sürprizlerle dolu kurgusuyla dikkat çeken "${activeItem.name}", dram ile gizem unsurlarını kusursuz biçimde harmanlayarak izleyicisine eşsiz bir sinema deneyimi sunuyor.`,
          `Etkileyici atmosfer tasarımı ve hafızalardan silinmeyecek final sahnesiyle sinema dünyasında ses getiren "${activeItem.name}", insan doğasının sınırlarını sınayan sıra dışı hikayesiyle merak uyandırıyor.`
        ];
        description = fallbacks[charSum % fallbacks.length];
      }
    }
    
    return {
      year,
      rating,
      duration: isLiveChannel ? "Canlı Akış" : `${durationMin} dk`,
      genre,
      description,
      director: isLiveChannel ? "Yayıncı Ağları" : ["Christopher Nolan", "Martin Scorsese", "Quentin Tarantino", "Stanley Kubrick", "Nuri Bilge Ceylan", "Denis Villeneuve", "Guy Ritchie"][charSum % 7],
      actors: isLiveChannel ? "Canlı Moderatörler" : ["Leonardo DiCaprio, Cillian Murphy", "Robert De Niro, Al Pacino", "Christian Bale, Brad Pitt", "Meryl Streep, Haluk Bilginer", "Keanu Reeves, Laurence Fishburne", "Matthew McConaughey, Anne Hathaway"][charSum % 6]
    };
  }, [screenSlots, activeSlotId]);

  // Filtered items based on category search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Sidebar Tab Filter
      if (activeTab === "favoriler") {
        return favorites.some((f) => f.id === item.id);
      }

      // Category filter
      if (selectedCategory === "Favorilerim") {
        const isFav = favorites.some((f) => f.id === item.id);
        if (!isFav) return false;
      } else if (selectedCategory !== "Hepsi" && item.group !== selectedCategory) {
        return false;
      }

      // Search filtration
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesGroup = item.group.toLowerCase().includes(q);
        return matchesName || matchesGroup;
      }

      return true;
    });
  }, [items, selectedCategory, searchQuery, favorites, activeTab]);

  // Sliced items list for rendering only a segment at a time (increases DOM performance and fixes tab freeze)
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // Select channel to play on specific active slot
  const playItemInActiveSlot = (item: IPlaylistItem) => {
    setScreenSlots(prev => prev.map(slot => 
      slot.id === activeSlotId ? { ...slot, item } : slot
    ));
    
    // Smooth scroll to top player container on mobile/small screens
    setTimeout(() => {
      const el = document.getElementById("multi-screen-matrix-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Play next movie/channel in the filtered list for a slot
  const playNextItem = (slotId: number, currentId: string) => {
    const currentIndex = filteredItems.findIndex(x => x.id === currentId);
    if (currentIndex !== -1 && currentIndex < filteredItems.length - 1) {
      const nextItem = filteredItems[currentIndex + 1];
      setScreenSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, item: nextItem } : slot
      ));
    } else if (filteredItems.length > 0) {
      const nextItem = filteredItems[0];
      setScreenSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, item: nextItem } : slot
      ));
    }
  };

  // Play previous movie/channel in the filtered list for a slot
  const playPrevItem = (slotId: number, currentId: string) => {
    const currentIndex = filteredItems.findIndex(x => x.id === currentId);
    if (currentIndex !== -1 && currentIndex > 0) {
      const prevItem = filteredItems[currentIndex - 1];
      setScreenSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, item: prevItem } : slot
      ));
    } else if (filteredItems.length > 0) {
      const prevItem = filteredItems[filteredItems.length - 1];
      setScreenSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, item: prevItem } : slot
      ));
    }
  };

  // Clear a stream slot to empty
  const removeSlotItem = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setScreenSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, item: null } : slot
    ));
  };

  // Toggle Mute on a slot
  const toggleMute = (slotId: number) => {
    setScreenSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, isMuted: !slot.isMuted } : slot
    ));
  };

  const handleCustomPlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistInput.trim() !== "") {
      setCurrentPlaylistUrl(playlistInput.trim());
    }
  };

  const handlePresetLoad = (url: string) => {
    setPlaylistInput(url);
    setCurrentPlaylistUrl(url);
  };

  // Dynamic values for active slot item info
  const currentActiveItem = screenSlots[activeSlotId]?.item || screenSlots[0]?.item;

  const activePreset = ACCENT_THEME_PRESETS[accentTheme] || ACCENT_THEME_PRESETS.cyan;

  const dynamicVariablesStyle = {
    "--accent-primary": activePreset.primary,
    "--accent-hover": activePreset.hover,
    "--accent-active": activePreset.active,
    "--accent-text": activePreset.text,
    "--accent-bg": activePreset.bg,
    "--accent-bg-dark": activePreset.bgDark,
    "--accent-glow-rgb": activePreset.glow,
  } as React.CSSProperties;

  return (
    <div 
      style={dynamicVariablesStyle}
      className={`min-h-screen font-sans flex overflow-hidden transition-colors duration-300 w-full ${
        theme === "light" ? "bg-slate-50 text-slate-900" : "bg-[#050507] text-white"
      }`}
    >
      
      {/* MOBILE FLYOUT SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex md:hidden transition-all duration-300">
          <div className="w-80 bg-[#0a0a0c] border-r border-white/10 h-full p-5 flex flex-col gap-6 text-left overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className="font-extrabold uppercase tracking-wider text-sm">PLAYTV MOBILE</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Playlists section on Mobile top */}
            <div>
              <h4 className="text-[10px] uppercase font-bold text-orange-500 tracking-wider mb-2.5">M3U Listeleri</h4>
              <div className="flex flex-col gap-1.5">
                {savedPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => {
                      selectPlaylist(pl.url);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left text-xs p-2.5 rounded-xl transition truncate cursor-pointer ${
                      pl.url === currentPlaylistUrl
                        ? "bg-orange-600/10 border border-orange-500/30 text-orange-400 font-bold"
                        : "bg-white/5 text-white/50 hover:text-white"
                    }`}
                  >
                    {pl.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setActiveTab("ayarlar");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center text-[11px] bg-orange-600 hover:bg-orange-500 text-white font-bold p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  M3U Yönet & Ekle
                </button>
              </div>
            </div>

            {/* Category selection selector section */}
            <div className="flex-1 flex flex-col gap-2 min-h-0">
              <h4 className="text-[10px] uppercase font-bold text-orange-500 tracking-wider mb-1.5">Kategoriler</h4>
              <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-1 scrollbar-thin">
                <button
                  onClick={() => {
                    setSelectedCategory("Hepsi");
                    setActiveTab("canli");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-xl transition flex justify-between items-center cursor-pointer ${
                    selectedCategory === "Hepsi" && activeTab !== "favoriler"
                      ? "bg-white/10 text-orange-500 font-bold border-l-2 border-orange-500"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <span>Tüm Kategoriler</span>
                  <span className="text-[9px] bg-black/60 px-2 py-0.5 rounded text-white/50">{items.length}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("favoriler");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-xl transition flex justify-between items-center cursor-pointer ${
                    activeTab === "favoriler"
                      ? "bg-rose-950/20 text-rose-400 font-bold border-l-2 border-rose-500"
                      : "text-white/40 hover:text-rose-400"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                    Favoriler
                  </span>
                  <span className="text-[9px] bg-black/60 px-2 py-0.5 rounded text-white/50">{favorites.length}</span>
                </button>

                <div className="h-px bg-white/5 my-2" />

                {categories.map((cat) => {
                  const count = items.filter((item) => item.group === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveTab("canli");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left text-xs px-3 py-2.5 rounded-xl transition flex justify-between items-center cursor-pointer ${
                        selectedCategory === cat && activeTab !== "favoriler"
                          ? "bg-white/10 text-orange-500 font-bold border-l-2 border-orange-500"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      <span className="truncate max-w-[170px]">{cat}</span>
                      <span className="text-[9px] bg-black/60 px-2 py-0.5 rounded text-white/40">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-auto">
              <p className="text-[10px] text-white/30 text-center font-semibold uppercase tracking-wider">PlayTV Matrix v2.4</p>
            </div>
          </div>
          {/* Touch-to-dismiss background backdrop area */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
      
      {/* SIDEBAR NAVIGATION - IMMERSIVE UI STYLE */}
      <aside className={`w-20 border-r flex flex-col items-center py-6 gap-8 shrink-0 hidden md:flex z-40 transition-colors duration-300 ${
        theme === "light" ? "bg-white border-zinc-200" : "bg-[#0a0a0c] border-white/5"
      }`}>
        {/* Brand Indicator */}
        <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.5)] transition hover:scale-105 cursor-pointer">
          <Tv className="w-6 h-6 text-white animate-pulse" />
        </div>
        
        {/* Menu Actions */}
        <nav className="flex flex-col gap-5 mt-4">
          <button
            onClick={() => { setActiveTab("canli"); setSelectedCategory("Hepsi"); }}
            className={`p-3.5 rounded-xl transition-all duration-300 relative group cursor-pointer ${
              activeTab === "canli"
                ? "bg-white/10 text-orange-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
            title="Tüm Yayınlar"
          >
            <Compass className="w-5 h-5" />
            <span className="absolute left-20 bg-zinc-900 border border-zinc-800 text-white text-[10px] py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap font-medium tracking-wide z-50">
              Yayın Akışı
            </span>
          </button>

          <button
            onClick={() => setActiveTab("favoriler")}
            className={`p-3.5 rounded-xl transition-all duration-300 relative group cursor-pointer ${
              activeTab === "favoriler"
                ? "bg-rose-950/40 text-rose-500 border border-rose-900/30"
                : "text-white/40 hover:text-rose-500 hover:bg-white/5"
            }`}
            title="Favorilerim"
          >
            <Heart className="w-5 h-5 fill-current" />
            {favorites.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            )}
            <span className="absolute left-20 bg-zinc-900 border border-zinc-800 text-white text-[10px] py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap font-medium tracking-wide z-50">
              Favorilerim ({favorites.length})
            </span>
          </button>



          <button
            onClick={() => setActiveTab("ayarlar")}
            className={`p-3.5 rounded-xl transition-all duration-300 relative group cursor-pointer ${
              activeTab === "ayarlar"
                ? "bg-white/10 text-orange-500"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
            title="Ayarlar & Multi-Screen"
          >
            <Settings className="w-5 h-5" />
            <span className="absolute left-20 bg-zinc-900 border border-zinc-800 text-white text-[10px] py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap font-medium tracking-wide z-50">
              Gelişmiş Panel
            </span>
          </button>
        </nav>

        {/* Brand User Placeholder */}
        <div className="mt-auto p-3 hover:text-white text-white/40 cursor-pointer relative group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-orange-950/20">
            TV
          </div>
          <span className="absolute left-20 bg-zinc-900 border border-zinc-800 text-white text-[10px] py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap font-medium tracking-wide z-[60]">
            Aktif Kullanıcı
          </span>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen relative scrollbar-thin">
        
        {/* HEADER / TOP BAR */}
        <header className={`h-20 px-4 md:px-8 flex items-center justify-between border-b sticky top-0 z-30 transition-all duration-300 ${
          theme === 'light' ? 'bg-white/85 border-zinc-200 text-zinc-800' : 'bg-black/40 border-white/5 text-white'
        } backdrop-blur`}>
          <div className="flex items-center gap-2 md:gap-8 flex-1">
            
            {/* Mobile Sidebar menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2.5 mr-1 rounded-xl block md:hidden cursor-pointer transition ${
                theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              title="Kategoriler"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Quick search input */}
            <div className="relative max-w-xs w-full">
              <input 
                id="search-input"
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ara..." 
                className={`rounded-full py-2 px-10 w-full focus:outline-none focus:ring-2 focus:ring-orange-500/25 text-xs transition-all ${
                  theme === 'light' 
                    ? 'bg-zinc-100/90 border border-zinc-200 text-zinc-900 focus:bg-white focus:border-orange-500/55' 
                    : 'bg-white/5 border border-white/10 text-white focus:bg-[#0c0c0e] focus:border-orange-500/50'
                }`}
              />
              <Search className={`w-4 h-4 absolute left-4 top-2.5 ${theme === 'light' ? 'text-zinc-400' : 'text-white/35'}`} />
            </div>

            {/* Top Quick Category Selection Links */}
            <div className={`hidden sm:flex gap-4 md:gap-6 text-xs font-semibold ${theme === 'light' ? 'text-zinc-500' : 'text-white/60'}`}>
              <span 
                onClick={() => { setSelectedCategory("Hepsi"); setActiveTab("canli"); }}
                className={`cursor-pointer transition-colors ${selectedCategory === "Hepsi" && activeTab !== "favoriler" ? "text-orange-500 font-bold" : theme === 'light' ? "hover:text-black" : "hover:text-white"}`}
              >
                Popüler
              </span>
              <span 
                onClick={() => setActiveTab("canli")}
                className={`cursor-pointer transition-colors ${activeTab === "canli" ? "text-orange-500 font-bold" : theme === 'light' ? "hover:text-black" : "hover:text-white"}`}
              >
                Türler & Kanallar
              </span>
              <span 
                onClick={() => setActiveTab("favoriler")}
                className={`cursor-pointer transition-colors ${activeTab === "favoriler" ? "text-orange-500 font-bold" : theme === 'light' ? "hover:text-black" : "hover:text-white"}`}
              >
                Canlı TV / Favoriler
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition cursor-pointer shadow-sm ${
                theme === 'light' 
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900' 
                  : 'bg-zinc-900 hover:bg-white/5 border-white/10 text-white/90'
              }`}
              title={theme === 'light' ? "Karanlık Mod'a Geç" : "Aydınlık Mod'a Geç"}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-orange-400" />}
            </button>

            {/* Latency Optimization Banner */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${
              theme === 'light' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'light' ? 'bg-emerald-500' : 'bg-green-500'}`}></span>
              Gecikmesiz Yayın
            </div>
            {/* Low latency configuration toggler */}
            <button
              onClick={() => setLowLatencyEnabled(!lowLatencyEnabled)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                lowLatencyEnabled 
                  ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400" 
                  : theme === 'light' ? "bg-zinc-100 border-zinc-200 text-zinc-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"
              }`}
              title="Düşük Gecikme Modu (HLS)"
            >
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline">{lowLatencyEnabled ? "Low-Latency Mode" : "Standart Gecikme"}</span>
            </button>
          </div>
        </header>

        {/* CENTRAL AREA: INPUTS, LAYOUT SETTINGS, AND YAYIN AKIŞI MATRIX */}
        <div className="px-4 md:px-8 py-6 flex flex-col gap-8 w-full z-20">
          
          {/* MULTI_SCREEN SECTION WITH LAYOUT SELECTORS */}
          <section id="multi-screen-matrix-section" className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="text-left">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Monitor className="h-4.5 w-4.5 text-orange-500" />
                  ÇOKLU EKRAN MATRİSİ & OYNATICI
                </h2>
                <p className="text-[10px] text-white/50 mt-0.5">
                  Farklı yayınları dikey/yatay veya grid düzenlerinde eşzamanlı izleyin ve yönetin.
                </p>
              </div>

              {/* Layout controllers styled glowing */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5 self-start">
                <button
                  id="layout-single-btn"
                  onClick={() => setScreenLayout("single")}
                  className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors font-bold cursor-pointer ${
                    screenLayout === "single"
                      ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  Tekli Ekran
                </button>
                <button
                  id="layout-dual-btn"
                  onClick={() => setScreenLayout("dual")}
                  className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors font-bold cursor-pointer ${
                    screenLayout === "dual"
                      ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  İkili Ekran
                </button>
                <button
                  id="layout-quad-btn"
                  onClick={() => setScreenLayout("quad")}
                  className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors font-bold cursor-pointer ${
                    screenLayout === "quad"
                      ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  Dörtlü Ekran
                </button>
              </div>
            </div>

            {/* Render Multi-Screen Slots */}
            <div 
              className={`grid gap-4 transition-all duration-305 ${
                screenLayout === "single" 
                  ? "grid-cols-1 max-w-4xl mx-auto w-full" 
                  : screenLayout === "dual"
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
              }`}
            >
              {screenSlots
                .slice(0, screenLayout === "single" ? 1 : screenLayout === "dual" ? 2 : 4)
                .map((slot) => {
                  const isActiveSlot = slot.id === activeSlotId;
                  return (
                    <div 
                      key={slot.id} 
                      className="flex flex-col gap-2 cursor-pointer"
                      onClick={() => setActiveSlotId(slot.id)}
                    >
                      {/* Slot Header bar controls */}
                      <div className="flex justify-between items-center px-1">
                        <span className={`text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${isActiveSlot ? "text-orange-500" : "text-white/40"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isActiveSlot ? "bg-orange-500 animate-pulse" : "bg-white/10"}`} />
                          EKRAN {slot.id + 1} {isActiveSlot && "(Hedef Ekran Olarak Seçili)"}
                        </span>
                        {slot.item && (
                          <button
                            onClick={(e) => removeSlotItem(slot.id, e)}
                            className="hover:text-rose-400 text-white/50 text-[9px] font-semibold flex items-center gap-1 bg-[#121215] border border-white/5 px-2 py-0.5 rounded transition cursor-pointer"
                          >
                            <Minimize2 className="h-2.5 w-2.5" />
                            Kapat
                          </button>
                        )}
                      </div>

                      {/* Slot Player element */}
                      {slot.item ? (
                        <div className="flex flex-col gap-2">
                          <VideoPlayer
                            item={slot.item}
                            isMuted={slot.isMuted}
                            onMuteToggle={() => toggleMute(slot.id)}
                            lowLatencyEnabled={lowLatencyEnabled}
                            isActive={isActiveSlot}
                            onNext={() => playNextItem(slot.id, slot.item!.id)}
                            onPrev={() => playPrevItem(slot.id, slot.item!.id)}
                            allPlaylistItems={items}
                            onPlayItem={(newItem) => {
                              setScreenSlots(prev => prev.map(s => s.id === slot.id ? { ...s, item: newItem } : s));
                            }}
                          />
                          {/* Fast Transit Control Buttons under video */}
                          <div className="flex items-center justify-between gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-1.5 px-2">
                            <button
                              onClick={() => playPrevItem(slot.id, slot.item!.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-[#ff7a00]/10 hover:border-[#ff7a00]/30 active:scale-[0.98] border border-white/5 text-[10px] font-bold text-white/50 hover:text-[#ff7a00] py-1.5 rounded-lg transition-all cursor-pointer"
                              title="Önceki Film / Yayın"
                            >
                              <SkipBack className="h-3.5 w-3.5" />
                              Önceki Film / Yayın
                            </button>
                            <button
                              onClick={() => playNextItem(slot.id, slot.item!.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 active:scale-[0.98] border border-orange-500/10 text-[10px] font-bold text-white py-1.5 rounded-lg shadow-md hover:shadow-orange-500/15 transition-all cursor-pointer"
                              title="Sonraki Film / Yayın"
                            >
                              Sonraki Film / Yayın
                              <SkipForward className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`aspect-video rounded-xl bg-black/60 border border-dashed flex flex-col items-center justify-center text-center p-6 transition-all duration-300 ${
                            isActiveSlot 
                              ? "border-orange-500/50 bg-orange-950/5 shadow-[0_0_15px_rgba(234,88,12,0.1)]" 
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <Tv className={`h-8 w-8 mb-2 ${isActiveSlot ? "text-orange-500 animate-pulse" : "text-white/30"}`} />
                          <p className="text-white text-xs font-bold uppercase tracking-wider">Boş Ekran {slot.id + 1}</p>
                          <p className="text-white/40 text-[10px] mt-1 max-w-[210px] leading-relaxed">
                            Bu ekranı hedef olarak atadınız. Aşağıdaki listeden istediğiniz yayına tıklayarak izlemeye başlayın.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* NETFLIX-STYLE MOVIE/CHANNEL BRIEF RESUMÉ CARD */}
            {activeItemMetadata && (
              <div className={`mt-4 border-t pt-5 text-left ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
                <div className={`flex flex-col md:flex-row gap-5 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${
                  theme === 'light' ? 'bg-white border border-zinc-200 shadow-sm' : 'bg-[#08080a] border border-white/5'
                }`}>
                  <div className="absolute right-0 top-0 w-80 h-80 bg-orange-600/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex flex-col items-center justify-center text-center shrink-0 self-start p-2 shadow-inner ${
                    theme === 'light' ? 'bg-slate-100 border border-zinc-200' : 'bg-zinc-950 border border-white/10'
                  }`}>
                    {(screenSlots[activeSlotId]?.item || screenSlots[0]?.item)?.logo ? (
                      <img
                        src={(screenSlots[activeSlotId]?.item || screenSlots[0]?.item)?.logo}
                        alt=""
                        className="w-full h-full object-contain max-h-[70px]"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Film className="h-7 w-7 text-orange-500 animate-pulse" />
                    )}
                    <span className="text-[8px] font-extrabold text-orange-400 mt-1 uppercase tracking-widest">{activeItemMetadata.rating} / 10</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between gap-2.5 min-w-0">
                    <div>
                      <div className="flex items-center flex-wrap gap-2 text-[10px]">
                        {activeItemMetadata.genre && activeItemMetadata.genre !== "Genel" && activeItemMetadata.genre !== "General" && (
                          <span className="bg-orange-600/10 border border-orange-500/30 text-orange-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Grup: {activeItemMetadata.genre}
                          </span>
                        )}
                        <span className={`font-semibold ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>{activeItemMetadata.year}</span>
                        <span className="h-1 w-1 bg-zinc-400 rounded-full" />
                        <span className={`font-semibold ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>{activeItemMetadata.duration}</span>
                        <span className="h-1 w-1 bg-zinc-400 rounded-full" />
                        <span className="bg-green-700/10 border border-green-500/30 text-green-500 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                          HD KALİTE
                        </span>
                      </div>

                      <h3 className={`text-base md:text-lg font-bold mt-1.5 flex items-center gap-2 truncate ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                        {(screenSlots[activeSlotId]?.item || screenSlots[0]?.item)?.name}
                      </h3>

                      <p className={`text-xs leading-relaxed mt-2 max-w-4xl font-sans ${theme === 'light' ? 'text-zinc-600' : 'text-white/70'}`}>
                        {activeItemMetadata.description}
                      </p>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] border-t pt-2 mt-1 ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Yönetmen & Ağ:</span>
                        <span className={`font-bold truncate ${theme === 'light' ? 'text-zinc-700' : 'text-white/80'}`}>{activeItemMetadata.director}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Oyuncu & Sunucu:</span>
                        <span className={`font-bold truncate ${theme === 'light' ? 'text-zinc-700' : 'text-white/80'}`}>{activeItemMetadata.actors}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* DYNAMIC CHANNELS GRID & SIDEBAR METADATA PANELS */}
          <div className="flex flex-col gap-6 w-full">

            {/* Channels presentation list */}
            <section className="w-full flex flex-col gap-6">

              {/* Horizontal scrollable category selectors */}
              <div id="horizontal-category-pills" className="flex items-center gap-2 overflow-x-auto pb-3.5 pt-1.5 scrollbar-none select-none max-w-full">
                <button
                  onClick={() => { setSelectedCategory("Hepsi"); setActiveTab("canli"); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border ${
                    selectedCategory === "Hepsi" && activeTab !== "favoriler"
                      ? "bg-orange-500/10 border-orange-500 text-orange-500"
                      : theme === 'light' ? "border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-100" : "border-white/5 bg-white/[0.02] text-white/45 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  Tüm Yayınlar ({items.length})
                </button>

                <button
                  onClick={() => setActiveTab("favoriler")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border ${
                    activeTab === "favoriler"
                      ? "bg-rose-500/10 border-rose-500 text-rose-500"
                      : theme === 'light' ? "border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-100" : "border-white/5 bg-white/[0.02] text-white/45 hover:text-rose-500 hover:bg-white/5"
                  }`}
                >
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  Favoriler ({favorites.length})
                </button>

                {categories
                  .filter(cat => cat !== "Genel" && cat !== "General")
                  .map((cat) => {
                    const count = items.filter((item) => item.group === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setActiveTab("canli"); }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 border ${
                          selectedCategory === cat && activeTab !== "favoriler"
                            ? "bg-orange-500/10 border-orange-500 text-orange-500"
                            : theme === 'light' ? "border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-100" : "border-white/5 bg-white/[0.02] text-white/45 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {cat}
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          selectedCategory === cat && activeTab !== "favoriler"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-black/25 text-white/30"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Layout view controls and counters bar */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 pt-1 text-left select-none ${
                theme === 'light' ? 'border-zinc-200' : 'border-white/5'
              }`}>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                    theme === 'light' ? 'text-zinc-800' : 'text-white'
                  }`}>
                    {activeTab === "favoriler" ? "FAVORİ KANALLARIM" : `${selectedCategory} LİSTESİ`}
                    <span className="font-mono text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                      {filteredItems.length} yayın bulundu
                    </span>
                  </h3>
                  <p className={`text-[10px] mt-0.5 ${
                    theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    Kanalları ve filmleri listelemek için dilediğiniz şablon görünümünü seçin.
                  </p>
                </div>

                {/* Switch view modes selection panel */}
                <div className={`flex items-center p-1 rounded-xl border gap-1 max-w-fit ${
                  theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-black/40 border-white/5'
                }`}>
                  <button
                    onClick={() => { setLayoutMode("grid"); localStorage.setItem("iptv_layout_mode", "grid"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      layoutMode === "grid"
                        ? "bg-orange-500 text-white shadow-sm"
                        : theme === 'light' ? "text-zinc-500 hover:text-zinc-800" : "text-white/40 hover:text-white"
                    }`}
                    title="Kılavuz Görünümü"
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>Kılavuz</span>
                  </button>

                  <button
                    onClick={() => { setLayoutMode("karo"); localStorage.setItem("iptv_layout_mode", "karo"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      layoutMode === "karo"
                        ? "bg-orange-500 text-white shadow-sm"
                        : theme === 'light' ? "text-zinc-500 hover:text-zinc-800" : "text-white/40 hover:text-white"
                    }`}
                    title="Karo Görünümü"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Karo</span>
                  </button>

                  <button
                    onClick={() => { setLayoutMode("list"); localStorage.setItem("iptv_layout_mode", "list"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      layoutMode === "list"
                        ? "bg-orange-500 text-white shadow-sm"
                        : theme === 'light' ? "text-zinc-500 hover:text-zinc-800" : "text-white/40 hover:text-white"
                    }`}
                    title="Liste Görünümü"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Liste</span>
                  </button>
                </div>
              </div>

              {/* Dynamic playlist loading alert messages */}
              {error && (
                <div className="bg-rose-950/15 border border-rose-900/40 p-4 rounded-xl flex items-start gap-3 text-left">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-400">Veri Alma Uyarısı</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {isUsingFallback && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 text-left">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1 font-sans">
                      Yedek Yayın Listesi Aktif
                    </h4>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-sans">
                      Seçtiğiniz kanal listesi yüklenemedi {fallbackErrorNote ? `(${fallbackErrorNote})` : "veya şu anda çevrimdışı durumda"}. 
                      Uygulamanızın kesintisiz çalışması için kararlı ulusal canlı TV ve film kütüphanelerimizi içeren 
                      <b> yedek listemiz </b> otomatik olarak devreye alındı. Dilerseniz ekranın altındaki listeden veya 
                      <b> Ayarlar </b> menüsünden diğer IPTV kanallarını seçebilir ya da özel M3U linklerinizi kaydedebilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic playlist loading status indicators */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-24 bg-[#0a0a0c]/60 border border-dashed border-white/10 rounded-xl">
                  <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mb-3" />
                  <p className="text-white text-xs font-bold uppercase tracking-wider">M3U Listesi Dinamik Olarak Pars Ediliyor...</p>
                  <p className="text-white/40 text-[10px] mt-1">Düşük gecikmeli çözme optimizasyonu yapılıyor, lütfen bekleyin.</p>
                </div>
              ) : activeTab === "ayarlar" ? (
                <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-4 md:p-6 text-left flex flex-col gap-6">
                  {/* Premium Theme Color Preset Selector */}
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-orange-400" />
                      SİTE GENEL TEMASI VE RENK PALETİ
                    </h3>
                    <p className="text-xs text-white/50 mt-1 font-sans">
                      Arayüz renklerini, glow efektlerini ve oynatıcı temasını anında değiştirmek için bir palet renk seçin.
                    </p>
                  </div>

                  <div className="bg-[#050507] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">Renk Paleti Preseti Seçin</h4>
                      <span className="text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                        Aktif: {activePreset.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-1">
                      {Object.entries(ACCENT_THEME_PRESETS).map(([key, value]) => {
                        const isPresetSelected = accentTheme === key;
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setAccentTheme(key);
                              localStorage.setItem("iptv_accent_theme", key);
                            }}
                            className={`flex items-center justify-between sm:justify-center flex-row sm:flex-col gap-2.5 p-3 rounded-xl border text-left sm:text-center transition-all cursor-pointer ${
                              isPresetSelected
                                ? "border-orange-500 bg-orange-500/10 shadow-orange-glow-sm"
                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:flex-col sm:gap-1.5 justify-center">
                              {/* Color Orb Bubble with Glow */}
                              <div 
                                className="w-4.5 h-4.5 rounded-full border border-white/25 relative flex items-center justify-center shrink-0"
                                style={{ backgroundColor: value.primary, boxShadow: `0 0 10px ${value.primary}` }}
                              >
                                {isPresetSelected && (
                                  <Check className="h-2.5 w-2.5 text-black font-extrabold stroke-[3.5px]" />
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-white font-sans">{value.colorName}</span>
                            </div>
                            <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              isPresetSelected 
                                ? "bg-orange-500/20 text-orange-400" 
                                : "bg-white/5 text-white/30"
                            }`}>
                              {isPresetSelected ? "AKTİF" : "SEÇ"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-b border-white/5 pb-4 mt-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                       <FolderPlus className="h-5 w-5 text-orange-500" />
                       M3U PLAYLIST YÖNETİCİSİ
                    </h3>
                    <p className="text-xs text-white/50 mt-1 font-sans">
                      Farklı M3U IPTV linkleri ekleyin, kaydedin, düzenleyin ve aralarında anında geçiş yapın.
                    </p>
                  </div>

                  {/* Playlist Ekleme Formu */}
                  <div className="bg-[#050507] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">Yeni M3U Listesi Ekle</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Liste Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: Sinema Paketi, Canlı Yayınlar..."
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-white font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">M3U Bağlantı Adresi (URL)</label>
                        <input
                          type="text"
                          placeholder="https://example.com/iptv.m3u"
                          value={newPlaylistUrl}
                          onChange={(e) => setNewPlaylistUrl(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-white font-sans"
                        />
                      </div>
                    </div>

                    {/* Warning note if using content:// or local pathways */}
                    {(newPlaylistUrl.startsWith("content://") || newPlaylistUrl.startsWith("file://")) && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-[11px] text-orange-400 leading-relaxed font-sans mt-1">
                        <b>Önemli Bilgi:</b> Android 'content://' veya yerel 'file://' dosya yolları tarayıcılar tarafından doğrudan uzaktan indirilemez. Lütfen listenizi çalıştırmak için aşağıdaki <b>Yerel .m3u / .m3u8 Dosyası Yükle</b> alanından dosyanızı seçin.
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-2">
                      <div className="text-[10px] text-white/40 font-sans">
                        * Bağlantı adresleri sunucuda dinamik CORS proxy ile bypass edilerek işlenir.
                      </div>
                      <button
                        onClick={() => {
                          if (!newPlaylistName.trim() || !newPlaylistUrl.trim()) return;
                          addPlaylist(newPlaylistName, newPlaylistUrl);
                          setNewPlaylistName("");
                          setNewPlaylistUrl("");
                        }}
                        className="self-end bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Sisteme Kaydet & Aktifleştir
                      </button>
                    </div>

                    {/* Divider split */}
                    <div className="relative my-2 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                      </div>
                      <span className="relative px-3 bg-[#050507] text-[9px] uppercase text-white/25 font-bold tracking-widest">veya</span>
                    </div>

                    {/* Premium Drag and Drop File Input Area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsFileDragging(true);
                      }}
                      onDragLeave={() => setIsFileDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsFileDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processFile(file);
                      }}
                      className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        isFileDragging
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                      }`}
                      onClick={() => document.getElementById("m3u-file-uploader")?.click()}
                    >
                      <input
                        id="m3u-file-uploader"
                        type="file"
                        accept=".m3u,.m3u8,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="p-2.5 rounded-full bg-white/5 text-orange-400">
                        <Upload className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white font-sans">Yerel .m3u / .m3u8 Dosyası Yükleyin</p>
                        <p className="text-[10px] text-white/40 mt-1 font-sans">Dosyayı buraya sürükleyip bırakabilir veya seçmek için tıklayabilirsiniz</p>
                      </div>
                    </div>
                  </div>

                  {/* Kayıtlı M3U Listeleri */}
                  <div className="flex flex-col gap-3 font-sans">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">Kayıtlı Listeleriniz</h4>
                    {savedPlaylists.length === 0 ? (
                      <p className="text-xs text-white/30 italic">Kayıtlı liste bulunmuyor.</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {savedPlaylists.map((pl) => {
                          const isEditing = pl.id === editingPlaylistId;
                          const isActive = pl.url === currentPlaylistUrl;
                          
                          return (
                            <div
                              key={pl.id}
                              className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                isActive 
                                  ? "bg-orange-600/5 border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.05)]" 
                                  : "bg-[#050507]/60 border-white/5 hover:border-white/10"
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      className="w-full bg-zinc-900 border border-orange-500/40 rounded-lg p-2 text-xs text-white"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      value={editingUrl}
                                      onChange={(e) => setEditingUrl(e.target.value)}
                                      className="w-full bg-zinc-900 border border-orange-500/40 rounded-lg p-2 text-xs text-white font-mono"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-left flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs truncate text-white">{pl.name}</span>
                                    {isActive && (
                                      <span className="bg-orange-500/10 border border-orange-500/35 text-[9px] text-orange-400 font-extrabold px-1.5 py-0.5 rounded-full">
                                        AKTİF
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-white/40 truncate font-mono mt-1">{pl.url}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => updatePlaylist(pl.id, editingName, editingUrl)}
                                      className="bg-green-600 hover:bg-green-500 text-white rounded-lg p-2 transition cursor-pointer"
                                      title="Kaydet"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingPlaylistId(null)}
                                      className="bg-zinc-850 hover:bg-zinc-800 text-white rounded-lg p-2 transition cursor-pointer"
                                      title="İptal"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {!isActive && (
                                      <button
                                        onClick={() => selectPlaylist(pl.url)}
                                        className="bg-zinc-850 hover:bg-orange-600 hover:text-white text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                      >
                                        Seç & Yükle
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEditingPlaylistId(pl.id);
                                        setEditingName(pl.name);
                                        setEditingUrl(pl.url);
                                      }}
                                      className="bg-zinc-850/40 hover:bg-zinc-850 hover:text-white text-zinc-400 p-2 rounded-lg transition cursor-pointer"
                                      title="Düzenle"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deletePlaylist(pl.id)}
                                      className="bg-zinc-850/40 hover:bg-rose-950 hover:text-rose-400 text-zinc-500 p-2 rounded-lg transition cursor-pointer"
                                      title="Sil"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 bg-[#0a0a0c]/60 border border-dashed border-white/10 rounded-2xl text-center select-none font-sans">
                  <BookOpen className="h-8 w-8 text-white/20 mb-2" />
                  <p className="text-white text-xs font-bold uppercase tracking-wider">Liste Boş</p>
                  <p className="text-white/40 text-[10px] mt-1 max-w-[280px]">
                    Filtre ölçütlerine uygun herhangi bir yayın bulunamadı ya da favori listeniz boş.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {layoutMode === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {visibleItems.map((item) => {
                        const isFav = favorites.some((f) => f.id === item.id);
                        const isCurrentlyPlayingInAnySlot = screenSlots.some(s => s.item?.id === item.id);

                        return (
                          <div
                            key={item.id}
                            id={`channel-card-${item.id}`}
                            className={`relative group flex flex-col border rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none ${
                              isCurrentlyPlayingInAnySlot 
                                ? "border-orange-500/60 bg-orange-500/5 shadow-[0_0_15px_rgba(234,88,12,0.15)] animate-pulse" 
                                : theme === 'light' 
                                  ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:bg-zinc-50/55" 
                                  : "bg-[#0c0c0f] border-white/5 hover:border-white/20"
                            }`}
                            onClick={() => playItemInActiveSlot(item)}
                          >
                            {/* Logo header image */}
                            <div className={`relative aspect-[4/3] flex items-center justify-center overflow-hidden border-b ${
                              theme === 'light' ? 'bg-zinc-100/80 border-zinc-200' : 'bg-black/60 border-white/5'
                            }`}>
                              {item.logo ? (
                                <img
                                  src={item.logo}
                                  alt=""
                                  className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-350"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className={`text-[20px] font-black select-none uppercase font-display tracking-widest ${
                                  theme === 'light' ? 'text-zinc-300/80' : 'text-white/5'
                                }`}>
                                  IPTV
                                </div>
                              )}

                              {/* Favorite control button Overlay */}
                              <div className="absolute top-2 right-2 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all border ${
                                    isFav 
                                      ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-lg" 
                                      : theme === 'light'
                                        ? "bg-white border-zinc-200 text-zinc-400 hover:text-rose-500 hover:border-rose-450"
                                        : "bg-black/80 border-white/5 text-white/40 hover:text-rose-500 hover:scale-110"
                                  }`}
                                  title={isFav ? "Favorilerden Çıkar" : "Favoriye Ekle"}
                                >
                                  <Heart className={`h-3 w-3 ${isFav ? "fill-rose-500" : ""}`} />
                                </button>
                              </div>

                              {/* On Hover play button effect */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-950/50 hover:scale-110 active:scale-95 transition-all">
                                  <Play className="w-4 h-4 fill-white ml-0.5" />
                                </div>
                              </div>
                            </div>

                            {/* Text Metadata info section */}
                            <div className="p-3 flex flex-col justify-between flex-1 text-left min-h-[60px]">
                              <p className={`text-[11px] font-bold transition-colors line-clamp-2 leading-snug ${
                                theme === 'light' ? 'text-zinc-800' : 'text-white'
                              }`}>
                                {item.name}
                              </p>
                              
                              <div className={`flex items-center justify-between mt-2 pt-1 border-t ${
                                theme === 'light' ? 'border-zinc-200' : 'border-white/5'
                              }`}>
                                <span className={`text-[9px] truncate max-w-[90px] uppercase font-semibold ${
                                  theme === 'light' ? 'text-zinc-500' : 'text-white/35'
                                }`}>
                                  {item.group !== "Genel" && item.group !== "General" ? item.group : "Yayın"}
                                </span>
                                {isCurrentlyPlayingInAnySlot && (
                                  <span className="text-[8px] bg-orange-500/10 border border-orange-500/30 text-orange-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest">
                                    İzleniyor
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {layoutMode === "karo" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {visibleItems.map((item) => {
                        const isFav = favorites.some((f) => f.id === item.id);
                        const isCurrentlyPlayingInAnySlot = screenSlots.some(s => s.item?.id === item.id);

                        return (
                          <div
                            key={item.id}
                            className={`relative group flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-350 hover:-translate-y-1.5 cursor-pointer select-none border ${
                              isCurrentlyPlayingInAnySlot 
                                ? "border-orange-500/60 bg-orange-500/5 shadow-[0_0_20px_rgba(234,88,12,0.25)]" 
                                : theme === 'light' 
                                  ? "bg-white border-zinc-200/90 hover:border-zinc-300 shadow-sm" 
                                  : "bg-[#09090b]/80 border-white/5 hover:border-white/15"
                            }`}
                            onClick={() => playItemInActiveSlot(item)}
                          >
                            {/* Poster layout container */}
                            <div className={`relative h-[180px] w-full flex items-center justify-center overflow-hidden border-b ${
                              theme === 'light' ? 'bg-gradient-to-t from-zinc-105 to-zinc-50 border-zinc-100' : 'bg-gradient-to-t from-black to-zinc-950 border-white/5'
                            }`}>
                              {item.logo ? (
                                <img
                                  src={item.logo}
                                  alt=""
                                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Film className={`h-12 w-12 stroke-[1.2px] ${theme === 'light' ? 'text-zinc-300' : 'text-zinc-800'}`} />
                              )}

                              {/* Glowing Accent Ring on playing */}
                              {isCurrentlyPlayingInAnySlot && (
                                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-[0_2px_10px_rgba(234,88,12,0.4)]">
                                  YAYINDA
                                </div>
                              )}

                              {/* Favorite Toggle button */}
                              <div className="absolute top-3 right-3 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item);
                                  }}
                                  className={`p-2 rounded-xl transition-all ${
                                    isFav 
                                      ? "bg-rose-500 text-white shadow-lg" 
                                      : "bg-black/60 backdrop-blur-md text-white/60 hover:text-rose-550 border border-white/5 hover:scale-105"
                                  }`}
                                  title={isFav ? "Favorilerden Çıkar" : "Favoriye Ekle"}
                                >
                                  <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-current" : ""}`} />
                                </button>
                              </div>

                              {/* Play Accent hover button overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-[0_5px_15px_rgba(234,88,12,0.4)] hover:scale-110 active:scale-95 transition-all">
                                  <Play className="w-5 h-5 fill-white ml-0.5" />
                                </div>
                              </div>
                            </div>

                            {/* Info metadata section */}
                            <div className="p-4 flex flex-col justify-between flex-1 text-left">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                                    theme === 'light' ? 'bg-zinc-200/80 text-zinc-700' : 'bg-white/5 text-white/50'
                                  }`}>
                                    {item.group !== "Genel" && item.group !== "General" ? item.group : "IPTV Medya"}
                                  </span>
                                  {item.name.toLowerCase().includes("hds") || item.name.toLowerCase().includes("hd") ? (
                                    <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[8px] font-extrabold px-1.5 py-0.2 rounded">HD</span>
                                  ) : null}
                                </div>
                                <h4 className={`font-black text-sm mt-2 line-clamp-2 leading-relaxed tracking-tight ${
                                  theme === 'light' ? 'text-zinc-900' : 'text-white'
                                }`}>
                                  {item.name}
                                </h4>
                              </div>

                              <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
                                theme === 'light' ? 'border-zinc-100' : 'border-white/5'
                              }`}>
                                <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                                  theme === 'light' ? 'text-zinc-650' : 'text-zinc-400'
                                }`}>
                                  <Tv className="h-3.5 w-3.5 text-orange-500" />
                                  Şimdi İzle
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">ID: {item.id.slice(0, 5)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {layoutMode === "list" && (
                    <div className="flex flex-col gap-2">
                      {visibleItems.map((item, idx) => {
                        const isFav = favorites.some((f) => f.id === item.id);
                        const isCurrentlyPlayingInAnySlot = screenSlots.some(s => s.item?.id === item.id);

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-all duration-250 cursor-pointer select-none ${
                              isCurrentlyPlayingInAnySlot 
                                ? "border-orange-500/70 bg-orange-500/5 shadow-[0_2px_10px_rgba(234,88,12,0.1)]" 
                                : theme === 'light' 
                                  ? "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50" 
                                  : "bg-[#0b0b0e] border-white/5 hover:border-white/10 hover:bg-[#0c0c11]"
                            }`}
                            onClick={() => playItemInActiveSlot(item)}
                          >
                            {/* Left part: Order metric, Logo and titles */}
                            <div className="flex items-center gap-3.5 min-w-0 flex-1 text-left">
                              <span className="font-mono text-xs font-bold text-zinc-600 w-5 text-right hidden sm:inline">
                                {idx + 1}
                              </span>

                              {/* Logo square */}
                              <div className={`h-11 w-11 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border ${
                                theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-black/60 border-white/5'
                              }`}>
                                {item.logo ? (
                                  <img
                                    src={item.logo}
                                    alt=""
                                    className="w-full h-full object-contain p-1"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Tv className={`h-5 w-5 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                                )}
                              </div>

                              {/* Stream Metadata */}
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-bold text-xs sm:text-sm truncate ${
                                  theme === 'light' ? 'text-zinc-900' : 'text-white'
                                }`}>
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                                    theme === 'light' ? 'text-zinc-500' : 'text-white/30'
                                  }`}>
                                    {item.group !== "Genel" && item.group !== "General" ? item.group : "Yayın"}
                                  </span>
                                  <span className="h-1 w-1 bg-zinc-700 rounded-full" />
                                  <span className="text-[10px] text-orange-500/80 font-mono">Düşük Gecikme</span>
                                </div>
                              </div>
                            </div>

                            {/* Right part: Quick actions panel */}
                            <div className="flex items-center gap-2.5">
                              {isCurrentlyPlayingInAnySlot && (
                                <span className="text-[8px] bg-orange-500/10 border border-orange-500/30 text-orange-400 font-extrabold px-2 py-1 rounded uppercase tracking-wider hidden sm:inline">
                                  İZLENİYOR
                                </span>
                              )}

                              {/* Heart Toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item);
                                }}
                                className={`p-2 rounded-lg transition border ${
                                  isFav 
                                    ? "bg-rose-500/20 border-rose-500 text-rose-500" 
                                    : theme === 'light'
                                      ? "bg-zinc-100 border-zinc-200 text-zinc-400 hover:text-rose-500"
                                      : "bg-black/40 border-white/5 text-white/30 hover:text-rose-500"
                                }`}
                                title={isFav ? "Favorilerden Çıkar" : "Favoriye Ekle"}
                              >
                                <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-rose-500" : ""}`} />
                              </button>

                              {/* Direct play trigger */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playItemInActiveSlot(item);
                                }}
                                className="bg-orange-600 hover:bg-orange-500 text-white rounded-lg p-2 transition cursor-pointer"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}


                  {/* Load More Button for High-scale lists */}
                  {filteredItems.length > visibleCount && (
                    <div className="flex flex-col items-center gap-2 mt-4 pb-6">
                      <p className="text-[11px] text-white/40">
                        Gösterilen: <strong className="text-white/70">{visibleCount}</strong> / Toplam filtrelenmiş yayın: <strong className="text-white/70">{filteredItems.length}</strong>
                      </p>
                      <button
                        onClick={() => setVisibleCount(prev => prev + 60)}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs uppercase px-8 py-3 rounded-xl transition shadow-[0_4px_20px_rgba(234,88,12,0.3)] hover:-translate-y-0.5 active:translate-y-0 focus:outline-none cursor-pointer flex items-center gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Daha Fazla İçerik Yükle (+60)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>
        </div>

        {/* BOTTOM GLOBAL TELEMETRY / STATS CONTROLS */}
        <footer className="border-t border-white/5 bg-[#08080a] mt-auto py-8 px-6 text-left">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">PLAYTV ACTIVE IMMERSIVE PANEL</h3>
              </div>
              <p className="text-[10.5px] text-white/40 mt-1 max-w-xl leading-relaxed">
                Bu platform düşük gecikmeli canlı HLS paket çözme protokolü(LL-HLS) ve anlık geri sarma (timeshift) teknolojisinden yararlanmaktadır. M3U listesindeki tüm içerikler dinamik olarak tarayıcınızda çözümlenir.
              </p>
            </div>
            
            <div className="flex gap-4 items-center text-xs font-semibold text-white/50 bg-black/40 border border-white/5 p-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-orange-500" />
                Anlık Geri Sarma
              </span>
              <div className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Çoklu Ekran v2.4
              </span>
            </div>
          </div>
        </footer>

        {/* MOBILE FLOATING TAB NAVIGATOR BAR */}
        <div className="fixed bottom-4 left-4 right-4 bg-black/90 backdrop-blur-lg border border-white/10 rounded-2xl h-16 flex items-center justify-around z-40 shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-2 md:hidden">
          <button
            onClick={() => { setActiveTab("canli"); setSelectedCategory("Hepsi"); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "canli" ? "text-orange-500 scale-105" : "text-white/40 hover:text-white"
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-1 tracking-tight">Akış</span>
          </button>
          
          <button
            onClick={() => setActiveTab("favoriler")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition relative ${
              activeTab === "favoriler" ? "text-rose-500 scale-105" : "text-white/40 hover:text-white"
            }`}
          >
            <Heart className={`h-5 w-5 ${activeTab === "favoriler" ? "fill-rose-500" : ""}`} />
            {favorites.length > 0 && (
              <span className="absolute top-1 right-2 h-1.5 w-1.5 bg-rose-500 rounded-full" />
            )}
            <span className="text-[9px] font-bold mt-1 tracking-tight">Favoriler</span>
          </button>



          <button
            onClick={() => setActiveTab("ayarlar")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
              activeTab === "ayarlar" ? "text-orange-500 scale-105" : "text-white/40 hover:text-white"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-1 tracking-tight">M3U Ayar</span>
          </button>
        </div>

      </main>

    </div>
  );
}

