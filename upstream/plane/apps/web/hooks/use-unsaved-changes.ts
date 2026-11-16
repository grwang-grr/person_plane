import { useCallback, useEffect } from "react";
import { useBeforeUnload, useBlocker } from "react-router";

/** Guard router navigation and browser refresh while an editor has unsaved content. */
export function useUnsavedChanges(dirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      `${currentLocation.pathname}${currentLocation.search}` !== `${nextLocation.pathname}${nextLocation.search}`
  );
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("有未保存的内容，确定离开并放弃更改吗？")) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (dirty) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty]
    )
  );
}
