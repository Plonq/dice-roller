export class Utils {
  static randIntRange(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
}
