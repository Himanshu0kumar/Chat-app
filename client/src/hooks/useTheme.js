import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { selectTheme, toggleTheme as toggleThemeAction } from '../store/slices/themeSlice.js';

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  return { theme, toggleTheme };
}
