import { useState } from "react";
import { useFloating, flip, shift, useDismiss, useInteractions, FloatingPortal } from "@floating-ui/react";
import FilterButton from './FilterButton';
import FilterContent from './FilterContent';

const FilterPanel = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      flip(),
      shift(),
    ],
    placement: "bottom-start",
  });

  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative mr-4">
      <FilterButton
        ref={refs.setReference}
        isOpen={isOpen}
        onClick={handleToggle}
        {...getReferenceProps()}
      />

      {isOpen && ( // isOpen일 때만 Portal을 통해 렌더링
        <FloatingPortal>
          <FilterContent
            ref={refs.setFloating}
            isOpen={isOpen}
            floatingStyles={floatingStyles} // Floating UI에서 계산된 스타일 전달
            {...getFloatingProps()}
          />
        </FloatingPortal>
      )}
    </div>
  );
};

export default FilterPanel;