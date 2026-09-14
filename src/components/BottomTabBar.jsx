export function BottomTabBar({ categories, activeCategoryId, onSelect }) {
  return (
    <nav className="bottom-tab-bar" role="tablist" aria-label="Workshop categories">
      {categories.map((category) => {
        const isActive = category.id === activeCategoryId
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            id={`tab-${category.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${category.id}`}
            className={`bottom-tab-bar__tab bottom-tab-bar__tab--${category.id}${isActive ? ' bottom-tab-bar__tab--active' : ''}`}
            onClick={() => onSelect(category.id)}
          >
            {category.label}
          </button>
        )
      })}
    </nav>
  )
}
