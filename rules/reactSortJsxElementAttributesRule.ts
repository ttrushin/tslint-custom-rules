import * as ts from "typescript";
import * as Lint from "tslint";
import { startsWith } from "lodash";

export class Rule extends Lint.Rules.AbstractRule {
  // tslint:disable object-literal-sort-keys
  public static metadata: Lint.IRuleMetadata = {
    ruleName: "react-sort-jsx-element-attributes",
    description:
      "Make sure that JSX Elements have their attributes sorted alphabetically",
    optionsDescription: "Not configurable.",
    options: null,
    optionExamples: ["true"],
    type: "style",
    typescriptOnly: false,
    hasFix: true
  };
  // tslint:enable object-literal-sort-keys

  public static FAILURE_STRING = `JSX Elements must be sorted alphabetically.`;

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

function walk(ctx: Lint.WalkContext<void>) {
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    if (ts.isJsxOpeningLikeElement(node)) {
      const props = node.attributes.properties;

      const sortedProps = [...props];
      sortedProps.sort((propA, propB) => {
        const aText = propA.getText().toLowerCase();
        const bText = propB.getText().toLowerCase();

        const aIsSpread = startsWith(aText, "{...");
        const bIsSpread = startsWith(bText, "{...");
        const aIsComment = startsWith(aText, "{/*");
        const bIsComment = startsWith(bText, "{/*");

        // Sort props containing a spread earlier, or vice versa
        if (aIsSpread && !bIsSpread) {
          return -1;
        } else if (bIsSpread && !aIsSpread) {
          return 1;
        }

        // Sort props containing a comment earlier, or vice versa
        if (aIsComment && !bIsComment) {
          return -1;
        } else if (bIsComment && !aIsComment) {
          return 1;
        }

        return aText < bText ? -1 : 1;
      });

      // Instantiate an empty Replacement array
      const replacementArray: Lint.Replacement[] = [];

      // Determine which members are out of order and push a new Replacement into the Replacement array for each
      props.forEach((value, index) => {
        const text = value.getText();
        const sortedText = sortedProps[index].getText();
        if (sortedText !== text) {
          replacementArray.push(
            Lint.Replacement.replaceFromTo(
              value.getStart(),
              value.getEnd(),
              sortedText
            )
          );
        }
      });

      // If we have replacements, add the failure to the node so that TSLint can fix the issue automatically for the user
      if (replacementArray.length > 0) {
        ctx.addFailureAtNode(
          node.tagName,
          Rule.FAILURE_STRING,
          replacementArray
        );
      }
    }

    return ts.forEachChild(node, cb);
  });
}
