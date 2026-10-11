export function warnBeforeUnload(event) {
  event.preventDefault();
  event.returnValue = true;
}
