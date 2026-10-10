import { Moon, Sun } from "lucide-react"

interface ThemeToggleProps {
  dark: boolean
  onToggle: () => void
}

export default function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <button className="icon-button" type="button" onClick={onToggle} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} title={`Switch to ${dark ? "light" : "dark"} mode`}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
