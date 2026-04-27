interface SidePanelResizerProps {
  detailRef: React.RefObject<HTMLDivElement | null>;
  resizerPosition: number;
  isHover: boolean;
  isResizing: boolean;
  resizerMouseDownHandler: () => void;
  setIsHover: (v: boolean) => void;
}

const SidePanelResizer = ({
  resizerPosition,
  isHover,
  isResizing,
  resizerMouseDownHandler,
  setIsHover,
}: SidePanelResizerProps) => {
  return (
    <div
      className={`w-1 absolute top-0 h-full m-0 p-0 box-border bg-gray-500 opacity-0 translate-x-1 ${
        (isHover || isResizing) && "opacity-40 cursor-ew-resize"
      }`}
      onMouseDown={resizerMouseDownHandler}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{ right: resizerPosition, zIndex: 200 }}
    />
  );
};

export default SidePanelResizer;