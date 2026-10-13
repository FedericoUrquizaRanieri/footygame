"use client";

import Image from "next/image";
import { useState } from "react";
import s from "./ui.module.css";

/** Bandera chica (PNG propio en public/flags). Si el archivo no está, no dibuja nada. Decorativa. */
export function Flag({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      className={s.flag}
      src={src}
      alt=""
      width={48}
      height={36}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
