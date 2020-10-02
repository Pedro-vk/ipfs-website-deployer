export async function generatorToArray<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const array: T[] = [];
  for await (const value of generator) {
    array.push(value);
  }
  return array;
}
