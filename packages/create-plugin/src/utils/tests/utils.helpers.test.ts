import { partitionArr } from '../utils.helpers.js';

describe('partitionArr', () => {
  it('should partition an array of numbers based on a predicate', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const isEven = (num: number) => num % 2 === 0;
    const result = partitionArr(arr, isEven);
    expect(result).toEqual([
      [2, 4, 6],
      [1, 3, 5],
    ]);
  });

  it('should partition an array of strings based on a predicate', () => {
    const arr = ['apple', 'banana', 'cherry', 'date'];
    const startsWithA = (str: string) => str[0] === 'a';
    const result = partitionArr(arr, startsWithA);
    expect(result).toEqual([['apple'], ['banana', 'cherry', 'date']]);
  });

  it('should return two empty arrays if the input array is empty', () => {
    const arr: number[] = [];
    const isEven = (num: number) => num % 2 === 0;
    const result = partitionArr(arr, isEven);
    expect(result).toEqual([[], []]);
  });

  it('should place all items in the first partition if all match the predicate', () => {
    const arr = [2, 4, 6, 8];
    const isEven = (num: number) => num % 2 === 0;
    const result = partitionArr(arr, isEven);
    expect(result).toEqual([[2, 4, 6, 8], []]);
  });

  it('should place all items in the second partition if none match the predicate', () => {
    const arr = [1, 3, 5, 7];
    const isEven = (num: number) => num % 2 === 0;
    const result = partitionArr(arr, isEven);
    expect(result).toEqual([[], [1, 3, 5, 7]]);
  });

  it('should work with a complex object array and predicate', () => {
    const arr = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
      { name: 'Charlie', age: 35 },
    ];
    const isUnder30 = (person: { name: string; age: number }) => person.age < 30;
    const result = partitionArr(arr, isUnder30);
    expect(result).toEqual([
      [{ name: 'Alice', age: 25 }],
      [
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
      ],
    ]);
  });
});
