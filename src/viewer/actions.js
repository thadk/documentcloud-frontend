import { layout } from "./layout";
import { changeMode } from "./document";

export function enterRedactMode() {
  changeMode("image");
  layout.rawRedaction = null;
  layout.rawPendingRedactions = [];
  layout.action = "redact";
}

export function enterAnnotateMode() {
  changeMode("image");
  layout.annotationPending = false;
  layout.rawAnnotation = null;
  layout.action = "annotate";
}

export function enterModifyMode() {
  changeMode("thumbnail");
  layout.action = "modify";
}

export function enterSelectNoteMode() {
  changeMode("image");
  layout.action = "selectnote";
}

export function enterInfoMode() {
  layout.showInfo = true;
}

export function enterDataMode() {
  layout.showData = true;
}

export function enterSectionsMode() {
  layout.showEditSections = true;
}
