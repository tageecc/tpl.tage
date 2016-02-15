$(function(){
    ue.scrollbar({
        height : 350,
        scroll_per : 100,//每次滚动滑轮，滚动条移动10像素
        scrollbarbg : $(".v_scrollbar_bg"),
        target : $(".sidebar"),
        box : $(".box_main"),
        scrollbar : $(".v_scrollbar"),
        btn : $(".v_scrollbar_btn")
    });
});

$('.box_main li a').on('click',function(){

    return false;
})