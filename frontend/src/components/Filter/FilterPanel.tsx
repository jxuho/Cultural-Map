import { useState } from 'react';
import {
  useFloating,
  flip,
  shift,
  useDismiss,
  useInteractions,
  FloatingPortal,
  size,
} from '@floating-ui/react';
import FilterButton from './FilterButton';
import FilterContent from './FilterContent';

const FilterPanel = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      flip(), 
      shift({ padding: 10 }), // 화면 끝에서 10px 여유 확보
      size({
        apply({ availableWidth, availableHeight, elements }) {
          // 뷰포트 가용 범위 내에서만 크기를 가지도록 제한
          Object.assign(elements.floating.style, {
            maxWidth: `${availableWidth - 20}px`,
            maxHeight: `${availableHeight - 20}px`,
          });
        },
      }),
    ],
    placement: 'bottom-start',
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

      {isOpen && (
        <FloatingPortal>
          <FilterContent
            ref={refs.setFloating}
            isOpen={isOpen}
            floatingStyles={{...floatingStyles, zIndex: 100}}
            {...getFloatingProps()}
          />
        </FloatingPortal>
      )}
    </div>
  );
};

export default FilterPanel;
