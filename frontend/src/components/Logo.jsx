/** Знак: осколки статуи в рамке (мотив логотипа) + серифный wordmark. */
export default function Logo() {
  return (
    <span className="logo">
      <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="3" y="3" width="58" height="58" fill="none" stroke="currentColor" strokeWidth="2.6" />
        <polygon points="30,12 41,19 33,27 25,21" fill="currentColor" />
        <polygon points="23,30 35,28 38,38 26,41" fill="currentColor" />
        <polygon points="41,30 47,36 42,44 38,40" fill="currentColor" opacity=".85" />
        <polygon points="21,45 31,44 28,53 19,50" fill="currentColor" opacity=".9" />
        <polygon points="44,14 50,16 47,23" fill="currentColor" opacity=".7" />
        <polygon points="15,23 21,25 18,32 14,29" fill="currentColor" opacity=".65" />
      </svg>
      <span className="logo-word">
        Illuminart<sup>AI</sup>
      </span>
    </span>
  )
}
