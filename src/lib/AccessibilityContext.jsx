import React, { createContext, useContext, useEffect, useState } from 'react';

const SIZES = {
  normal: { label: 'א',  px: '14px', tip: 'רגיל'   },
  large:  { label: 'א',  px: '16px', tip: 'גדול'   },
  xl:     { label: 'א',  px: '18px', tip: 'גדול מאוד' },
};

const Ctx = createContext({
  fontSize: 'normal',
  setFontSize: () => {},
  sizes: SIZES,
  schoolGender: 'female',
  setSchoolGender: () => {},
  g: (f, m) => f,          // g(female-form, male-form) → returns correct form
  gTitle: (role) => role,  // returns localized role title
});

// Hebrew role titles per gender
const ROLE_TITLES = {
  female: {
    admin: 'מנהלת', vice_principal: 'סגנית מנהלת', secretary: 'מזכירה',
    teacher: 'עובדת הוראה', counselor: 'יועצת', coordinator: 'רכזת',
    maintenance: 'אב בית', substitute: 'ממלאת מקום', assistant: 'סייעת', user: 'עובדת'
  },
  male: {
    admin: 'מנהל', vice_principal: 'סגן מנהל', secretary: 'מזכיר',
    teacher: 'עובד הוראה', counselor: 'יועץ', coordinator: 'רכז',
    maintenance: 'אב בית', substitute: 'ממלא מקום', assistant: 'סייע', user: 'עובד'
  },
};

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSizeState]   = useState(() => localStorage.getItem('sb-fontsize')   || 'normal');
  const [schoolGender, setSchoolGenderState] = useState(() => localStorage.getItem('sb-gender') || 'female');

  const setFontSize = (size) => {
    setFontSizeState(size);
    localStorage.setItem('sb-fontsize', size);
  };

  const setSchoolGender = (g) => {
    setSchoolGenderState(g);
    localStorage.setItem('sb-gender', g);
  };

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[fontSize]?.px || '14px';
  }, [fontSize]);

  const g = (female, male = female) => schoolGender === 'male' ? male : female;

  const gTitle = (role) => {
    const map = schoolGender === 'male' ? ROLE_TITLES.male : ROLE_TITLES.female;
    return map[role] || role;
  };

  return (
    <Ctx.Provider value={{ fontSize, setFontSize, sizes: SIZES, schoolGender, setSchoolGender, g, gTitle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAccessibility = () => useContext(Ctx);
