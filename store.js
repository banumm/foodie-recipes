import React, { createContext, useContext, useReducer } from 'react';

const initial = { favs: [], mine: [] };

function reducer(s, a) {
  switch (a.type) {
    case 'TOGGLE_FAV':
      return { ...s, favs: s.favs.includes(a.id) ? s.favs.filter((x) => x !== a.id) : [...s.favs, a.id] };
    case 'SAVE': {
      const exists = s.mine.some((m) => m.id === a.recipe.id);
      return { ...s, mine: exists ? s.mine.map((m) => (m.id === a.recipe.id ? a.recipe : m)) : [...s.mine, a.recipe] };
    }
    case 'DELETE':
      return { favs: s.favs.filter((x) => x !== a.id), mine: s.mine.filter((m) => m.id !== a.id) };
    default:
      return s;
  }
}

const Ctx = createContext(null);
export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
};
export const useStore = () => useContext(Ctx);
