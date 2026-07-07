"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Shield, Baby, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PROFILE_AVATARS, getAvatar } from "@/lib/avatars";
import type { Profile } from "@/lib/api-client";
import { createProfile, updateProfile, deleteProfile } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileGateProps {
  profiles: Profile[];
  accountId: string;
  onSelect: (profile: Profile) => void;
  onChanged: () => void;
}

export function ProfileGate({ profiles, accountId, onSelect, onChanged }: ProfileGateProps) {
  const [editing, setEditing] = useState(false);
  const [manageTarget, setManageTarget] = useState<Profile | "new" | null>(null);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#0b0b0f] overflow-hidden">
      {/* Ambient gradient background */}
      <div className="ambient-gradient ambient-gradient-1" />
      <div className="ambient-gradient ambient-gradient-2" />
      <div className="ambient-gradient ambient-gradient-3" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-4xl md:text-5xl font-black tracking-tighter text-white">BD</span>
          <span className="text-4xl md:text-5xl font-black tracking-tighter bdnflix-red">Nflix</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-semibold text-white/90">
          {editing ? "Manage Profiles" : "Who's watching?"}
        </h1>
      </motion.div>

      <div className="flex flex-wrap items-start justify-center gap-4 md:gap-8 max-w-4xl">
        <AnimatePresence mode="popLayout">
          {profiles.map((p, idx) => (
            <ProfileTile
              key={p.id}
              profile={p}
              editing={editing}
              index={idx}
              onSelect={() => !editing && onSelect(p)}
              onManage={() => setManageTarget(p)}
            />
          ))}
        </AnimatePresence>

        {profiles.length < 5 && !editing && (
          <button
            onClick={() => setManageTarget("new")}
            className="group flex flex-col items-center gap-3"
          >
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-lg border-2 border-white/20 flex items-center justify-center transition-all duration-300 group-hover:border-white group-hover:scale-105 bg-white/5">
              <Plus className="w-10 h-10 md:w-14 md:h-14 text-white/50 group-hover:text-white" />
            </div>
            <span className="text-white/60 group-hover:text-white font-medium">Add Profile</span>
          </button>
        )}
      </div>

      <div className="mt-12">
        {editing ? (
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setEditing(false)}
          >
            Done
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="text-white/60 hover:text-white border border-white/20 px-6 py-2"
            onClick={() => setEditing(true)}
          >
            Manage Profiles
          </Button>
        )}
      </div>

      <AnimatePresence>
        {manageTarget && (
          <ProfileManageDialog
            target={manageTarget}
            onClose={() => setManageTarget(null)}
            onChanged={() => {
              onChanged();
              setManageTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileTile({
  profile,
  editing,
  index,
  onSelect,
  onManage,
}: {
  profile: Profile;
  editing: boolean;
  index: number;
  onSelect: () => void;
  onManage: () => void;
}) {
  const avatar = getAvatar(profile.avatar);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col items-center gap-3"
    >
      <button
        onClick={editing ? onManage : onSelect}
        className="group relative w-24 h-24 md:w-36 md:h-36 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 card-shadow"
        style={{ background: avatar.gradient }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-6xl">
          {avatar.emoji}
        </div>
        {profile.isKids && (
          <div className="absolute top-1 right-1 bg-white/90 text-black rounded-full p-1">
            <Baby className="w-3 h-3 md:w-4 md:h-4" />
          </div>
        )}
        {profile.pin && (
          <div className="absolute top-1 left-1 bg-black/70 text-white rounded-full p-1">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
          </div>
        )}
        {editing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Pencil className="w-7 h-7 md:w-10 md:h-10 text-white" />
          </div>
        )}
      </button>
      <span className="text-white/70 group-hover:text-white font-medium text-sm md:text-base max-w-[9rem] truncate">
        {profile.name}
      </span>
    </motion.div>
  );
}

function ProfileManageDialog({
  target,
  onClose,
  onChanged,
}: {
  target: Profile | "new";
  onClose: () => void;
  onChanged: () => void;
}) {
  const isNew = target === "new";
  const [name, setName] = useState(isNew ? "" : target.name);
  const [avatarId, setAvatarId] = useState(isNew ? PROFILE_AVATARS[0].id : target.avatar);
  const [isKids, setIsKids] = useState(isNew ? false : target.isKids);
  const [pin, setPin] = useState("");
  const [usePin, setUsePin] = useState(!isNew && !!target.pin);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createProfile({ name: name.trim(), avatar: avatarId, isKids });
        toast.success("Profile created");
      } else {
        await updateProfile(target.id, {
          name: name.trim(),
          avatar: avatarId,
          isKids,
          pin: usePin && pin ? pin : usePin && target.pin ? target.pin : null,
        });
        toast.success("Profile updated");
      }
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew) return;
    setSaving(true);
    try {
      await deleteProfile(target.id);
      toast.success("Profile deleted");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#16161d] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isNew ? "Create Profile" : "Edit Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Profile name"
              className="bg-white/5 border-white/10 text-white"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Avatar</Label>
            <div className="grid grid-cols-5 gap-2">
              {PROFILE_AVATARS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAvatarId(a.id)}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-2xl transition-all",
                    avatarId === a.id ? "ring-2 ring-bdnflix-red scale-105" : "opacity-70 hover:opacity-100",
                  )}
                  style={{ background: a.gradient }}
                >
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white/90">Kids profile</span>
            </div>
            <Switch checked={isKids} onCheckedChange={setIsKids} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white/90">Profile lock (PIN)</span>
            </div>
            <Switch checked={usePin} onCheckedChange={setUsePin} />
          </div>

          {usePin && (
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={isNew ? "4-digit PIN" : "Enter new PIN to change (leave blank to keep)"}
              inputMode="numeric"
              className="bg-white/5 border-white/10 text-white tracking-widest"
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {!isNew && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="mr-auto bg-white/10 text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={saving} className="text-white/70 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-bdnflix-red hover:bg-bdnflix-red-dark text-white">
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
