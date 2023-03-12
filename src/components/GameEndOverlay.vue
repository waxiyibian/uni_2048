<template>
  <div class="overlay" v-show="show">
    <p class="message">{{ contents }}</p>
    <button class="tryAgain" @click="restart">重新开始</button>
  </div>
</template>

<script lang="ts" setup>
import { toRefs, ref, computed } from "vue";

const props = defineProps({
  board: {
    type: Object,
    required: true,
  },
  onrestart: {
    type: Function,
    required: true,
  },
});

const { board } = toRefs(props);
const show = computed(() => {
  return board.value.hasWon() || board.value.hasLost();
});
const contents = computed(() => {
  if (board.value.hasWon()) {
    return "恭喜通关!";
  } else if (board.value.hasLost()) {
    return "闯关失败!";
  } else {
    return "";
  }
});
const restart = () => {
  props.onrestart && props.onrestart();
};
</script>
