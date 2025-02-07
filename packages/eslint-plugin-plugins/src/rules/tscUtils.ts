import { Exports } from '@grafana/levitate';
import ts, { Modifier, NodeArray } from 'typescript';
import { ExportInfo } from './types';

export function createTsProgram(fileName: string, compilerOptions: ts.CompilerOptions = {}): ts.Program {
  const program = ts.createProgram([fileName], {
    ...compilerOptions,
  });

  program.getTypeChecker();

  return program;
}

export function getExportInfo(rootFile: string): ExportInfo {
  const program = createTsProgram(rootFile);
  const programExports = getExportedSymbolsForProgram(program);

  return {
    exports: programExports,
    program,
  };
}

export function getExportedSymbolsForProgram(program: ts.Program): Exports {
  const rootFileNames = program.getRootFileNames();
  let programExports = {};

  // TODO: usually we are only running the tool against a single "root file", we could simplify the logic if we would only cater for that scenario instead of expecting multiple ones
  for (const sourceFile of program.getSourceFiles()) {
    if (!rootFileNames.includes(sourceFile.fileName)) {
      continue;
    }
    const checker = program.getTypeChecker();
    const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile);
    if (!sourceFileSymbol) {
      continue;
    }
    const exports = checker.getExportsOfModule(sourceFileSymbol);
    const groupedExports: Record<string, ts.Symbol> = {};
    for (const item of exports) {
      groupedExports[item.getName()] = item;
      Object.assign(groupedExports, getExportSubMembers(item, program));
    }

    programExports = { ...programExports, ...groupedExports };
  }

  return programExports;
}

const subMembersIgnoreList = ['prototype', '__proto__', '__constructor'];

function getExportSubMembers(symbol: ts.Symbol, program: ts.Program): Record<string, ts.Symbol> {
  const checker = program.getTypeChecker();
  const parentName = symbol.getName() || '';
  const subMembers: Record<string, ts.Symbol> = {};
  const declaredType = checker.getDeclaredTypeOfSymbol(symbol);
  const resolvedSymbol = declaredType.getSymbol() ?? symbol;

  // in most cases the resolvedSymbol should have the information. Using the symbol as a fallback
  const members = resolvedSymbol.members ?? symbol.members;
  if (members) {
    members.forEach((value, key) => {
      if (
        value !== undefined &&
        typeof key === 'string' &&
        !subMembersIgnoreList.includes(key) &&
        !isSymbolPrivateDeclaration(value)
      ) {
        subMembers[`${parentName}.${key}`] = value;
      }
    });
  }

  // in most cases the resolvedSymbol should have the information. Using the symbol as a fallback
  const exports = resolvedSymbol.exports ?? symbol.exports;
  if (exports) {
    exports.forEach((value, key) => {
      if (typeof key === 'string' && !subMembersIgnoreList.includes(key) && value) {
        subMembers[`${parentName}.${key}`] = value;
      }
    });
  }
  return subMembers;
}

export function getRuntimeExports(exports: Exports) {
  const result = [];
  for (const [currentExportName, currentExportSymbol] of Object.entries(exports)) {
    if (!(currentExportSymbol.flags & ts.SymbolFlags.Interface) && !(currentExportSymbol.flags & ts.SymbolFlags.Type)) {
      result.push(currentExportName);
    }
  }

  return result;
}

export function isSymbolPrivateDeclaration(symbol: ts.Symbol): boolean {
  try {
    if (!symbol.valueDeclaration) {
      return false;
    }
    // properties defined with '#' before the name are private fields
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields
    if (
      symbol.flags === ts.SymbolFlags.Property &&
      (symbol.getName().startsWith('#') || symbol.escapedName.toString().startsWith('__#'))
    ) {
      return true;
    }

    return (symbol.valueDeclaration,
    ts.isPropertyDeclaration(symbol.valueDeclaration) || ts.isMethodDeclaration(symbol.valueDeclaration)) &&
      'modifiers' in symbol.valueDeclaration
      ? ((symbol.valueDeclaration.modifiers as NodeArray<Modifier>)?.some(
          (modifier) =>
            modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword
        ) ?? false)
      : false;
  } catch (e) {
    return false;
  }
}
