(function(window, document, undefined) {


  function Slider(element, params) {
    this.el = document.querySelector(element);
    this.init(params);
  }
  Slider.prototype = {
    init: function(params) {
      var options = params;
      this.links = this.el.querySelectorAll(options.navigation + ' a');
      this.wrapper = this.el.querySelector(options.wrapper);
      this.slides = this.el.querySelectorAll(options.slide);
      this.total = this.slides.length;
      this.index = 0; 
      this.timer = null; 
      this.navigate(options);
      this.action(options);
    },
    navigate: function(options) {
      for (var i = 0; i < this.links.length; ++i) {
        var link = this.links[i];
        this.slide(link, options);
      }
    },
    slide: function(element, options) {
      var self = this;
      element.addEventListener("click", function(e) {
          e.preventDefault();
          var a = this;
          self.setCurrentLink(a);
          var index = parseInt(a.getAttribute(options.attribute), 10) + 1;
          var currentSlide = self.el.querySelector(options.slide + ":nth-child(" + index + ")");
          self._slideTo(index - 1);
        },
        false);
    },
    _slideTo: function(slide) {
      var currentSlide = this.slides[slide];
      currentSlide.style.opacity = 1;

      for (var i = 0; i < this.slides.length; i++) {
        var slide1 = this.slides[i];
        if (slide1 !== currentSlide) {
          slide1.style.opacity = 0;
        }
      }
    },
    setCurrentLink: function(link) {
      var parent = link.parentNode;
      var a = parent.querySelectorAll("a");
      link.className = "current";
      for (var j = 0; j < a.length; ++j) {
        var cur = a[j];
        if (cur !== link) {
          cur.className = "";
        }
      }
    },
    action: function(options) {
      var self = this;
      var link;
      self.timer = setInterval(function() {
        self.index++;
        if (self.index == self.slides.length) {
          self.index = 0;
        }
        link = self.links[self.index];
        self.setCurrentLink(link);
        self._slideTo(self.index);

      }, 4000);
    }

  };
  var par = {
      navigation: "#slider-nav",
      wrapper: "#slider-wrapper",
      slide: ".slider__slide",
      attribute: "data-slide"
    };
  var par1 = {
      navigation: ".testy-slider__nav",
      wrapper: ".testy-slider__wrapper",
      slide: ".testy-slider__slide",
      attribute: "data-slide"
    };
  document.addEventListener("DOMContentLoaded", function() {
    var aSlider = new Slider("#slider", par);
    var bSlider = new Slider(".testy-slider", par1);
  });
})(window, document);
