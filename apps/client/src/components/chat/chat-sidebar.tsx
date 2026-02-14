"use client";

import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useSocket } from "@/context/socket-context";
import { useAuth } from "@/context/auth-context";

export type SubscribedUser = {
  _id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen: string | null;
};

type ChatSidebarProps = {
  selectedUserId: string | null;
  onSelectUser: (user: SubscribedUser) => void;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Generate a consistent color from name
function getAvatarColor(name: string): string {
  const colors = [
    "hsl(220, 90%, 56%)", // blue
    "hsl(152, 69%, 45%)", // green
    "hsl(280, 67%, 55%)", // purple
    "hsl(350, 80%, 55%)", // rose
    "hsl(32, 90%, 55%)", // orange
    "hsl(190, 80%, 45%)", // cyan
    "hsl(330, 70%, 55%)", // pink
    "hsl(210, 70%, 50%)", // steel blue
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ChatSidebar({
  selectedUserId,
  onSelectUser,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [subscribedUsers, setSubscribedUsers] = useState<SubscribedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchSubscriptions = async () => {
      try {
        const users = await api<SubscribedUser[]>("/subscriptions/mine");
        setSubscribedUsers(users);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handlePresenceUpdate = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      setSubscribedUsers((prev) =>
        prev.map((u) =>
          u._id === data.userId ? { ...u, isOnline: data.isOnline } : u,
        ),
      );
    };
    socket.on("presenceUpdate", handlePresenceUpdate);
    return () => {
      socket.off("presenceUpdate", handlePresenceUpdate);
    };
  }, [socket]);

  const sortedUsers = [...subscribedUsers]
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
      return a.isOnline ? -1 : 1;
    });

  const onlineCount = subscribedUsers.filter((u) => u.isOnline).length;

  return (
    <aside
      className="w-70 flex flex-col shrink-0"
      style={{ background: "hsl(228, 20%, 12%)" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users
              className="w-4 h-4"
              style={{ color: "hsl(220, 14%, 55%)" }}
            />
            <h2 className="font-semibold text-sm text-white">Subscriptions</h2>
          </div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: "hsl(228, 18%, 18%)",
              color: "hsl(220, 14%, 55%)",
            }}
          >
            {onlineCount} online
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "hsl(220, 14%, 40%)" }}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-lg text-xs text-white placeholder-gray-500 outline-none transition-colors focus:ring-1"
            style={{
              background: "hsl(228, 18%, 16%)",
              borderColor: "transparent",
            }}
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-2">
        {loading ? (
          <div className="flex flex-col gap-2 px-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 animate-pulse"
              >
                <div
                  className="w-9 h-9 rounded-full"
                  style={{ background: "hsl(228, 18%, 20%)" }}
                />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="h-3 w-24 rounded"
                    style={{ background: "hsl(228, 18%, 20%)" }}
                  />
                  <div
                    className="h-2.5 w-14 rounded"
                    style={{ background: "hsl(228, 18%, 18%)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "hsl(220, 14%, 30%)" }}
            />
            <p className="text-xs" style={{ color: "hsl(220, 14%, 40%)" }}>
              {search ? "No users found" : "No subscriptions yet"}
            </p>
          </div>
        ) : (
          sortedUsers.map((su, i) => {
            const isSelected = selectedUserId === su._id;
            return (
              <button
                key={su._id}
                onClick={() => onSelectUser(su)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                  animate-fade-in
                  ${isSelected ? "shadow-sm" : "hover:opacity-90"}
                `}
                style={{
                  background: isSelected ? "hsl(220, 90%, 56%)" : "transparent",
                  animationDelay: `${i * 40}ms`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = "hsl(228, 18%, 16%)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      background: isSelected
                        ? "rgba(255,255,255,0.2)"
                        : getAvatarColor(su.name),
                    }}
                  >
                    {getInitials(su.name)}
                  </div>
                  {su.isOnline && (
                    <span
                      className="
                            absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                            bg-[hsl(152_69%_53%)]
                            ring-2 ring-[hsl(228_20%_12%)]
                            animate-pulse-dot
                        "
                    />
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-200"}`}
                  >
                    {su.name}
                  </p>
                  <p
                    className={`text-xs ${isSelected ? "text-blue-200" : ""}`}
                    style={
                      !isSelected
                        ? {
                            color: su.isOnline
                              ? "hsl(152, 69%, 53%)"
                              : "hsl(220, 14%, 40%)",
                          }
                        : {}
                    }
                  >
                    {su.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
