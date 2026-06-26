import type { VfNiveau } from "@/lib/scoring/vfV2";
import { Icon } from "@iconify/react";

interface MedalIconProps {
  niveau: VfNiveau;
  size?: number;
  className?: string;
}

/**
 * Colored medals using Google Noto Emoji (via Iconify).
 * - bronze → 3rd place medal 🥉
 * - argent → 2nd place medal 🥈
 * - or     → 1st place medal 🥇
 * - platine → trophy 🏆 (no dedicated platinum medal in Noto)
 */
export const MedalIcon = ({ niveau, size = 18, className }: MedalIconProps) => {
  const iconByNiveau: Record<VfNiveau, string> = {
    bronze: "noto:3rd-place-medal",
    argent: "noto:2nd-place-medal",
    or: "noto:1st-place-medal",
    platine: "noto:trophy",
  };
  return (
    <Icon
      icon={iconByNiveau[niveau]}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    />
  );
};

export default MedalIcon;