import { useEffect, useRef } from "react";
import useUiStore from "../../store/uiStore";
import useSidePanelResizer from "../../hooks/ui/useSidePanelResizer";

import SidePanelResizer from "./SidePanelResizer";
import SidePanelContent from "./SidePanelContent";
import SidePanelButtons from "./SidePanelButtons";

const SidePanel = () => {
  const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);
  const nearbySites = useUiStore((state) => state.nearbySites);
  const isCreateFormOpen = useUiStore((state) => state.isCreateFormOpen);
  const isUpdateFormOpen = useUiStore((state) => state.isUpdateFormOpen);
  const handleCloseAndCancel = useUiStore(
    (state) => state.handleCloseAndCancel
  );

  const detailRef = useRef<HTMLDivElement>(null);

  const resizer = useSidePanelResizer(detailRef);

  const { sidePanelWidth } = resizer;

  useEffect(() => {
    if (
      !isSidePanelOpen ||
      (!uiSelectedPlace?._id &&
        !nearbySites.length &&
        !isCreateFormOpen &&
        !isUpdateFormOpen)
    ) {
      if (!isSidePanelOpen) {
        handleCloseAndCancel(null);
      }
    }
  }, [
    isSidePanelOpen,
    uiSelectedPlace?._id,
    nearbySites.length,
    isCreateFormOpen,
    isUpdateFormOpen,
    handleCloseAndCancel,
  ]);

  if (!isSidePanelOpen) return null;

  return (
    <div
      ref={detailRef}
      className="absolute z-30 right-0 top-0 h-full shadow-lg bg-white flex flex-col"
      style={{
        width: sidePanelWidth,
        transition: "width 180ms ease",
        right: 0,
        boxShadow:
          "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
      }}
    >
      <SidePanelResizer detailRef={detailRef} {...resizer} />

      <SidePanelContent />
      <SidePanelButtons />
    </div>
  );
};

export default SidePanel;