<template>
    <div id="app">
        <Header />
        <Hero />
        <Editor />
    </div>
</template>

<script>
import Header from '@/components/Header.vue';
import Hero from '@/components/Hero.vue';
import Editor from '@/components/Editor.vue';

export default {
    name: "Home",
    components: {
        Header,
        Hero,
        Editor
    }
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');

* {
    padding: 0;
    margin: 0;
}

html,
body {
    width: 100%;
    height: 100%;

    margin: 0;
    padding: 0;

    font-family: 'Poppins', sans-serif;
}
</style>
