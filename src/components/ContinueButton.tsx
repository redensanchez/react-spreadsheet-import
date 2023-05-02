import { Button, ModalFooter, useStyleConfig } from "@chakra-ui/react"
import type { themeOverrides } from "../theme"

type ContinueButtonProps = {
  onContinue: (val: any) => void
  title: string
  isLoading?: boolean
}

export const ContinueButton = ({ onContinue, title, isLoading }: ContinueButtonProps) => {
  const styles = useStyleConfig("ContinueButton") as typeof themeOverrides["components"]["ContinueButton"]["baseStyle"]

  return (
    <ModalFooter>
      <Button sx={styles.button} size="lg" w="21rem" onClick={onContinue} isLoading={isLoading}>
        {title}
      </Button>
    </ModalFooter>
  )
}
