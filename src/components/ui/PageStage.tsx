import type { ReactNode } from "react";
import { PitchBackdrop, type PitchZone } from "./PitchBackdrop";
import s from "./backdrop.module.css";

/** Marco de página: el contenido va sobre la cancha (cada pantalla muestra otra zona). */
export function PageStage({
  zone = "box",
  calm = false,
  children,
}: {
  zone?: PitchZone;
  calm?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={s.stage}>
      <PitchBackdrop zone={zone} calm={calm} />
      {children}
    </div>
  );
}
