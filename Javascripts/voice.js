// Kiểm tra xem trình duyệt có hỗ trợ Web Speech API hay không
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    const toggleButton = document.getElementById('toggleButton');
    const clearButton = document.getElementById('clearButton');
    const textbox = document.getElementById('userInput');

    let isRecognizing = false;

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function () {
        isRecognizing = true;
        toggleButton.innerHTML = '<i style="font-size:15px; gap:10px" class="fa fa-microphone-slash"></i>'; // Change icon to microphone
    };
    recognition.onend = function () {
        isRecognizing = false;
        toggleButton.innerHTML = '<i style="font-size:15px; gap:10px" class="fa fa-microphone"></i>'; // Change icon to microphone-slash
    };

    recognition.onresult = function (event) {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        textbox.value = finalTranscript + interimTranscript;
    };

    toggleButton.addEventListener('click', function () {
        if (isRecognizing) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    clearButton.addEventListener('click', function () {
        textbox.value = '';
    });

} else {
    alert('Trình duyệt của bạn không hỗ trợ Web Speech API');
}