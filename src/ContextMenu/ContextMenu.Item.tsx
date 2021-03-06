import * as React from "react"
import { darken } from "../utils"
import styled from "../utils/styled"

export interface Props {
  condensed?: boolean
  width?: number
  onClick?: () => void
}

const Container = styled("div")<{
  onClick?: () => void
  condensed: Props["condensed"]
  width?: Props["width"]
}>(({ theme, onClick, condensed, width }) => ({
  userSelect: "none",
  label: "contextmenuitem",
  width: width || (condensed ? 160 : 250),
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  backgroundColor: theme.color.white,
  lineHeight: `${condensed ? 35 : 44}px`,
  padding: `0 ${theme.space.content}px`,
  ...(!!onClick
    ? {
        cursor: "pointer",
        color: theme.color.text.default,
        "&:hover": {
          backgroundColor: darken(theme.color.white, 2),
        },
      }
    : {
        cursor: "not-allowed",
        color: theme.color.text.lightest,
      }),
  "&:not(:first-child)": {
    borderTop: "1px solid",
    borderColor: theme.color.separators.default,
  },
  "&:last-child": {
    paddingBottom: 2,
  },
}))

const ContextMenuItem: React.SFC<Props> = props => (
  <Container {...props} condensed={props.condensed}>
    {props.children}
  </Container>
)

export default ContextMenuItem
