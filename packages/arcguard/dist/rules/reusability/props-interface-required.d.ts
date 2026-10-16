import { Rule } from '../../types';
/**
 * Every exported React component in a .tsx file must have an explicit Props type/interface.
 * Components with no props at all (no parameters) are exempt.
 *
 * Accepts any of:
 *   interface Props { … }
 *   type Props = { … }
 *   interface ButtonProps { … }
 *   FC<ButtonProps>  /  React.FC<Props>
 *   function Foo({ bar }: FooProps)
 */
declare const rule: Rule;
export default rule;
//# sourceMappingURL=props-interface-required.d.ts.map