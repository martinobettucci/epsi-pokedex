# Styling Guide

This guide establishes conventions for using Tailwind CSS and Lucide React to maintain a consistent and aesthetic design across the Pokémon Generator application.

## Tailwind CSS Conventions

*   **Base Styles**: Always use `bg-gradient-to-br from-blue-50 to-indigo-100` for the `body` background to maintain a light, inviting feel.
*   **Typography**:
    *   `font-sans antialiased text-gray-800` for general body text.
    *   Headings (`h1`, `h2`, `h3`): Use a combination of `font-extrabold` or `font-bold` with `text-indigo-800` or `text-gray-900`. Adjust sizes (`text-4xl`, `text-3xl`, `text-2xl`) for hierarchy.
*   **Containers & Cards**:
    *   Use `bg-white p-6 rounded-xl shadow-lg` for main content blocks and card components.
    *   Add `hover:shadow-xl transition-shadow duration-200` for interactive elements like Pokémon cards.
*   **Spacing**:
    *   Use Tailwind's default spacing scale (e.g., `p-4`, `m-6`, `gap-3`).
    *   Aim for consistent vertical rhythm.
*   **Colors**:
    *   **Primary**: `indigo-600` for primary actions, `indigo-700` for hover, `indigo-500` for focus rings.
    *   **Secondary**: `gray-200` for backgrounds, `gray-800` for text, `gray-300` for hover.
    *   **Danger**: `red-600` for destructive actions, `red-700` for hover.
    *   **Success**: `green-100` background, `green-800` text for success messages.
    *   **Error**: `red-100` background, `red-800` text for error messages.
    *   **Warning/Info**: `yellow-100` background, `yellow-800` text for token balance or info messages.
*   **Responsiveness**:
    *   Prioritize mobile-first design. Use responsive prefixes (`sm:`, `md:`, `lg:`) to adjust layouts and sizes.
    *   Example: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for card layouts.
*   **Interactive States**: Use `hover:`, `focus:`, `active:`, `disabled:` pseudo-classes for clear feedback.

## Lucide React Icons

*   **Import**: Always import icons directly from `lucide-react`.
*   **Usage**:
    *   Use icons to enhance button clarity, navigation elements, and status indicators.
    *   **Pokémon Generation**: `Sparkles` or `MagicWand`.
    *   **Resell**: `Coins` or `RefreshCw`.
    *   **Edit**: `Edit`.
    *   **Delete/Close**: `Trash2`, `X`, `XCircle`.
    *   **Save**: `Save`.
    *   **Token Balance**: `Gem` or `Wallet`.
*   **Sizing**:
    *   Icons accompanying text in buttons: `h-5 w-5`.
    *   Smaller icons (e.g., in cards): `h-4 w-4`.
    *   Larger display icons (e.g., in modals or main sections): `h-6 w-6` or `h-8 w-8`.
*   **Color**: Inherit `currentColor` where appropriate or explicitly set using Tailwind text color classes (e.g., `text-gray-500`).

## Component-Specific Guidelines

*   **Buttons**: Refer to `components/Button.tsx` for `variant` and `size` props, ensuring consistency.
*   **Modals**: Refer to `components/Modal.tsx` for `isOpen`, `onClose`, `title`, and confirmation props. Ensure accessibility (`aria-modal`, `role`).
*   **Forms**: Use `block text-sm font-medium text-gray-700 mb-2` for labels and `mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base` for inputs.
*   **Loaders**: Use a simple SVG spinner with `animate-spin` class for loading states, paired with a descriptive text.

By adhering to these guidelines, we ensure a unified and high-quality user experience across the entire application.