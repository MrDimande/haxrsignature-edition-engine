/**
 * Combines multiple CSS class names together.
 * Minimal, zero-dependency alternative to clsx/tailwind-merge.
 */
export function cn(...inputs: (string | undefined | null | boolean | { [key: string]: boolean })[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }
  
  return classes.join(" ");
}

/**
 * Delays execution for a specified duration in milliseconds.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
