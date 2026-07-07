import { translations } from '../src/lib/translations';

describe('Translation Dictionary', () => {
  it('contains English translations', () => {
    expect(translations.English).toBeDefined();
    expect(translations.English.navHome).toBe('Home');
  });

  it('contains Hindi translations', () => {
    expect(translations.Hindi).toBeDefined();
    expect(translations.Hindi.navHome).toBe('होम');
  });

  it('contains Marathi translations', () => {
    expect(translations.Marathi).toBeDefined();
    expect(translations.Marathi.navHome).toBe('मुख्यपृष्ठ');
  });

  it('contains voice feature keys in all languages', () => {
    const keys = ['btnVoiceStart', 'btnVoiceListening', 'btnLocation'];
    
    keys.forEach(key => {
      expect(translations.English[key as keyof typeof translations.English]).toBeDefined();
      expect(translations.Hindi[key as keyof typeof translations.Hindi]).toBeDefined();
      expect(translations.Marathi[key as keyof typeof translations.Marathi]).toBeDefined();
    });
  });
});
