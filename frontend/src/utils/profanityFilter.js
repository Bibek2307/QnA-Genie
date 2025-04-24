import Filter from 'bad-words';

const filter = new Filter();
// Add custom words to the filter
filter.addWords('customword1', 'customword2');

export const containsProfanity = (text) => {
  return filter.isProfane(text);
};

export const cleanText = (text) => {
  return filter.clean(text);
};

export const getProfanityWarning = (text) => {
  if (!containsProfanity(text)) return null;
  
  return {
    message: 'Your question contains inappropriate language.',
    suggestion: cleanText(text)
  };
}; 