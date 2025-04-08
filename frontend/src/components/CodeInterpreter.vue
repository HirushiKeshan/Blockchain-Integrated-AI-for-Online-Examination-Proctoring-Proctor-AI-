<template>
  <div class="code-interpreter">
    <textarea v-model="code" placeholder="Enter your code here..."></textarea>
    <select v-model="language">
      <option value="python">Python</option>
      <option value="javascript">JavaScript</option>
    </select>
    <button @click="executeCode">Run Code</button>

    <div class="output">
      <h3>Output:</h3>
      <pre>{{ output }}</pre>
      <h3>Error:</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      code: '',
      language: 'python',
      output: '',
      error: ''
    };
  },
  methods: {
    async executeCode() {
      try {
        const response = await fetch('http://localhost:5000/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: this.code, language: this.language })
        });

        const result = await response.json();
        this.output = result.output;
        this.error = result.error;
      } catch (err) {
        this.error = "Failed to execute code.";
      }
    }
  }
};
</script>

<style scoped>
.code-interpreter {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

textarea {
  width: 100%;
  height: 200px;
  font-family: monospace;
}

.output pre {
  background: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
}
</style>