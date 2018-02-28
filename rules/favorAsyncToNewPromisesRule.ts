import * as ts from "typescript";
import * as Lint from "tslint";

export class Rule extends Lint.Rules.AbstractRule {
  // tslint:disable object-literal-sort-keys
  public static metadata: Lint.IRuleMetadata = {
    ruleName: "favor-async-to-new-promises",
    description:
      "Warn the developer if they are returning a 'new Promise' rather than using the async/await paradigm",
    optionsDescription: "Not configurable.",
    options: null,
    optionExamples: ["true"],
    type: "functionality",
    typescriptOnly: false,
    hasFix: false
  };
  // tslint:enable object-literal-sort-keys

  public static FAILURE_STRING = `Rather than making a new Promise, use the async/await paradigm instead. If you MUST make a new Promise, feel free to silence this warning.`;

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

function walk(ctx: Lint.WalkContext<void>) {
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    if (
      ts.isNewExpression(node) && // node is a `new` expression
      ts.isIdentifier(node.expression) && // node's expression is an indentifier
      node.expression.getText() === "Promise" && // node's expression's text is "Promise"
      node.parent && // node has a parent
      ts.isReturnStatement(node.parent) // node's parent is a return statement
    ) {
      ctx.addFailure(
        node.expression.getFullStart() - 3, // the start of the word 'new'
        node.expression.getEnd(), // the end of the word 'Promise'
        Rule.FAILURE_STRING
      );
    }

    return ts.forEachChild(node, cb);
  });
}
