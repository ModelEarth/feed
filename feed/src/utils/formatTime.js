const formatTime = (sec) => {
    const min = Math.floor(sec / 60);
    const secRemain = Math.floor(sec % 60);
    return {
        min: min,
        sec: secRemain,
    };
};

export { formatTime };