export interface SectionProperties {
  area: number;
  inertia: number;
  centroidFromBottom: number;
  cTop: number;
  cBottom: number;
  cMax: number;
  sectionModulus: number;
}

export const calculateSectionProperties = (
  crossSection: string,
  width: number,
  height: number,
): SectionProperties => {
  if (crossSection === 'circular') {
    const radius = width / 2;
    const area = Math.PI * Math.pow(radius, 2);
    const inertia = (Math.PI * Math.pow(radius, 4)) / 4;

    return {
      area,
      inertia,
      centroidFromBottom: radius,
      cTop: radius,
      cBottom: radius,
      cMax: radius,
      sectionModulus: inertia / radius,
    };
  }

  if (crossSection === 'I-beam') {
    const webWidth = width * 0.4;
    const flangeThickness = height * 0.15;
    const area = width * height - (width - webWidth) * (height - 2 * flangeThickness);
    const inertia =
      (width * Math.pow(height, 3)) / 12 -
      ((width - webWidth) * Math.pow(height - 2 * flangeThickness, 3)) / 12;
    const c = height / 2;

    return {
      area,
      inertia,
      centroidFromBottom: c,
      cTop: c,
      cBottom: c,
      cMax: c,
      sectionModulus: inertia / c,
    };
  }

  if (crossSection === 'T-beam') {
    const flangeWidth = width;
    const flangeThickness = height * 0.2;
    const webWidth = width * 0.3;
    const webHeight = height * 0.8;
    const flangeArea = flangeWidth * flangeThickness;
    const webArea = webWidth * webHeight;
    const flangeCentroid = height - flangeThickness / 2;
    const webCentroid = webHeight / 2;
    const area = flangeArea + webArea;
    const centroidFromBottom =
      (flangeArea * flangeCentroid + webArea * webCentroid) / area;
    const flangeInertia =
      (flangeWidth * Math.pow(flangeThickness, 3)) / 12 +
      flangeArea * Math.pow(flangeCentroid - centroidFromBottom, 2);
    const webInertia =
      (webWidth * Math.pow(webHeight, 3)) / 12 +
      webArea * Math.pow(webCentroid - centroidFromBottom, 2);
    const inertia = flangeInertia + webInertia;
    const cTop = height - centroidFromBottom;
    const cBottom = centroidFromBottom;
    const cMax = Math.max(cTop, cBottom);

    return {
      area,
      inertia,
      centroidFromBottom,
      cTop,
      cBottom,
      cMax,
      sectionModulus: inertia / cMax,
    };
  }

  const area = width * height;
  const inertia = (width * Math.pow(height, 3)) / 12;
  const c = height / 2;

  return {
    area,
    inertia,
    centroidFromBottom: c,
    cTop: c,
    cBottom: c,
    cMax: c,
    sectionModulus: inertia / c,
  };
};

export const calculateArea = (crossSection: string, width: number, height: number) =>
  calculateSectionProperties(crossSection, width, height).area;
