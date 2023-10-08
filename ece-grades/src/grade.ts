import Grade from "./lib/components/Grade.svelte"

const grade = new Grade({
  target: undefined,
  props: {
    grade: undefined,
    weight: undefined,
  }
})

export default grade
