export const calculateArea = (crossSection: string, width: number, height: number) => {
  if (crossSection === 'rectangular') {
    return width * height;
  }
  if (crossSection === 'circular') {
    return Math.PI * Math.pow(width / 2, 2);
  }
  if (crossSection === 'I-beam') {
    const tw = width * 0.4;
    const tf = height * 0.15;
    return width * height - (width - tw) * (height - 2 * tf);
  }
  if (crossSection === 'T-beam') {
    const flangeWidth = width;
    const flangeThick = height * 0.2;
    const webWidth = width * 0.3;
    const webHeight = height * 0.8;
    return flangeWidth * flangeThick + webWidth * webHeight;
  }
  return width * height;
};
