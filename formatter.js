class Formatter {
  actualPrice(value) {
    try {
      const num = value.split(' ')[0];
      const floatValue = num.replace(',', '.')
      return parseFloat(floatValue ?? 0)
    } catch (e) {
      return null;
    }
  }

  oldPrice(value) {
    try {
      const num = value.split(' ')[0];
      const floatValue = num.replace(',', '.')
      return parseFloat(floatValue ?? 0)
    } catch (e) {
      return null;
    }
  }

  reviews(value) {
    try {
      const count = value.split(' ')[0];
      return parseInt(count);
    } catch (e) {
      return null;
    }
  }

  rating(value) {
    try {
      return parseFloat(value);
    } catch (e) {
      return null;
    }
  }
}

module.exports = new Formatter();