/**
 * An asset class in words, with its glyph (Tyler, 2026-09-21: "include
 * the asset class on all widget cards"). The glyph wears the class's
 * category tint and nothing else does: the word is the quiet ink, there
 * is no fill and no border, so a shelf of mixed classes reads as one
 * shelf with a small colour key in it. The same glyph and tint as the
 * filter chips, so a member who picks Venture above sees Venture below.
 */
import { ASSET_CLASS_GLYPH } from '@/components/AssetClassIcon';
import { ASSET_CLASSES, isAssetClass } from '@/lib/taxonomy';

import s from './AssetClassTag.module.css';

export default function AssetClassTag({ assetClass }: { assetClass: string }) {
  if (!isAssetClass(assetClass)) return null;
  const Glyph = ASSET_CLASS_GLYPH[assetClass];
  const { label, tint } = ASSET_CLASSES[assetClass];
  return (
    <span className={s.tag} style={{ ['--tag-tint' as string]: tint }}>
      <Glyph size={13} strokeWidth={1.75} aria-hidden="true" />
      {label}
    </span>
  );
}
