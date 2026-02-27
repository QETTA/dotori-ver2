/**
 * SVG module declarations for @svgr/webpack.
 * Allows: import Logo from './logo.svg'
 */

declare module '*.svg' {
  import type { FC, SVGProps } from 'react'
  const ReactComponent: FC<SVGProps<SVGSVGElement>>
  export default ReactComponent
}

declare module '*.svg?url' {
  const src: string
  export default src
}
