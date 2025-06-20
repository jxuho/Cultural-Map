// FilterPanel.jsx
import { useState, useMemo } from "react"; // useMemo를 import 합니다.
import useFilterStore from "../store/filterStore";
import { CULTURAL_CATEGORY } from "../config/culturalSiteConfig";
import debounce from "lodash.debounce"; // lodash.debounce를 import 합니다.

const FilterPanel = () => {
  const selectedCategories = useFilterStore(
    (state) => state.selectedCategories
  );
  const toggleCategory = useFilterStore((state) => state.toggleCategory);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const [isOpen, setIsOpen] = useState(false);

  // 로컬 상태를 사용하여 input의 현재 값을 제어합니다.
  // 이는 debounce가 적용된 setSearchQuery 호출이 약간 지연될 수 있기 때문에
  // input 필드에 즉각적인 피드백을 제공하기 위함입니다.
  const [localSearchInput, setLocalSearchInput] = useState(searchQuery);

  // searchQuery가 외부에서 변경될 때 (예: 필터 패널이 닫히거나 초기화될 때),
  // localSearchInput도 업데이트되도록 useEffect를 사용합니다.
  // useEffect(() => {
  //   setLocalSearchInput(searchQuery);
  // }, [searchQuery]); // 이 부분은 현재 setup에서는 필수는 아니지만, 외부 동기화가 필요할 때 유용합니다.

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // setSearchQuery를 디바운스 처리합니다.
  // useMemo를 사용하여 컴포넌트가 리렌더링될 때마다 새로운 디바운스 함수가 생성되지 않도록 합니다.
  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => {
      setSearchQuery(value);
    }, 300), // 원하는 디바운스 지연 시간 (밀리초)
    [setSearchQuery] // setSearchQuery 함수가 변경될 때만 debounced 함수를 다시 생성합니다.
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setLocalSearchInput(value); // input 필드에 즉시 반영
    debouncedSetSearchQuery(value); // 디바운스된 함수 호출
  };

  const handleClearSearch = () => {
    setLocalSearchInput(""); // 로컬 상태도 초기화
    setSearchQuery(""); // Zustand 상태도 초기화
    debouncedSetSearchQuery.cancel(); // 진행 중인 debounce 호출이 있다면 취소
  };

  return (
    <div
      className={`relative transition-all duration-300 ${
        isOpen ? "bg-white shadow-lg rounded-lg p-2" : ""
      }`}
    >
      <button
        onClick={handleToggle}
        className={`flex items-center justify-center px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
          isOpen
            ? "bg-blue-600 text-white hover:bg-blue-700 mb-2"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } min-w-[120px]`}
      >
        <span className="mr-2">
          {isOpen ? "Close Filters" : "Open Filters"}
        </span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap justify-center gap-2 pb-2">
            {CULTURAL_CATEGORY.map((category) => (
              <button
                key={category}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategories.includes(category)
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="p-2 relative">
            <input
              type="text"
              value={localSearchInput} // localSearchInput 사용
              onChange={handleSearchInputChange} // 새로운 핸들러 사용
              placeholder="Search by name or description..."
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
            />
            {localSearchInput && ( // localSearchInput을 기준으로 버튼 표시
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;